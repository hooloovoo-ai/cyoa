import { Alert, Box, Container, Snackbar } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactAudioPlayer from "react-audio-player";
import { fetchJSON } from "./util";
import Entry from "./Entry";
import { History, InitialPrompt, Suggestion } from "./types";
import { default as InitialPrompts } from "./prompts.json"

const LISTEN_INTERVAL = 33;
const REVEAL_DURATION = 45 * 1000;
const INITIAL_PROMPTS: InitialPrompt[] = InitialPrompts.prompts;

export default function Player() {

  const [errorMessage, setErrorMessage] = useState<string>();
  const handleErrorClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorMessage(undefined);
  }, []);

  const player = useRef<ReactAudioPlayer>(null);
  const [audioSrc, setAudioSrc] = useState<string>();

  const [history, setHistory] = useState<History[]>(() => {
    return [{
      text: "",
      lines: [],
      narrationDuration: 0,
      narrationURL: undefined,
      suggestions: INITIAL_PROMPTS.map(prompt => ({
        text: prompt.text,
        summary: `${prompt.genre}: ${prompt.title}`
      })),
      didReveal: false,
      editing: false,
      chosenSuggestion: undefined
    }]
  });

  const scrollIntoViewRef = useRef<HTMLDivElement>(null);
  const performScrolldown = useRef(false);
  const doScrolldown = useCallback(() => setTimeout(() => scrollIntoViewRef?.current?.scrollIntoView({ behavior: "auto", block: "nearest" }), 500), []);
  useEffect(() => {
    if (performScrolldown.current) {
      doScrolldown();
    }
    performScrolldown.current = true;
  }, [history]);


  const id = useMemo(() => Date.now().toString(), []);
  const suggest = useCallback((retry: boolean) => {
    const args = {
      'id': id,
      'text': history.reduce((prev, curr) => prev + curr.text, ""),
      'chunk': 0,
      'totalChunks': 1,
      'maxNewTokens': 256,
      'generations': 2,
      'summarize': true,
    };
    fetchJSON("https://api.hooloovoo.ai/generate", {
      method: "POST",
      cache: "no-cache",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args)
    })
      .catch(err => setErrorMessage(err.toString()))
      .then(data => {
        const suggestions: Suggestion[] = [];
        for (let i = 0; i < data.results.length; i++) {
          suggestions.push({
            text: data.results[i],
            summary: data.summaries[i]
          });
        }
        setHistory((prev) => {
          if (retry) {
            prev[prev.length - 1].suggestions = suggestions;
            return [...prev];
          } else {
            return [...prev, {
              text: "",
              lines: [],
              narrationDuration: undefined,
              narrationURL: undefined,
              suggestions: suggestions,
              didReveal: false,
              editing: false,
              chosenSuggestion: undefined
            }];
          }
        });
      });
  }, [history, id]);

  const onChooseSuggestion = useCallback((index: number) => {
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      last.text = last.suggestions[index].text;
      last.lines = last.text.split("\n");
      last.narrationDuration = REVEAL_DURATION;
      last.chosenSuggestion = index;
      last.editing = false;
      return [...prev];
    });
    suggest(false);
    // setAudioSrc(`https://api.hooloovoo.ai/tts?text=${encodeURIComponent(suggestions[index].text)}`)
  }, [suggest]);

  const onUndo = useCallback(() => {
    setHistory((prev) => {
      prev.pop();
      prev[prev.length - 1].editing = true;
      return [...prev];
    });
  }, []);

  const onRetry = useCallback(() => {
    setHistory((prev) => {
      prev[prev.length - 1].suggestions = [];
      setTimeout(() => suggest(true), 0);
      return [...prev];
    });
  }, [suggest]);

  return (
    <Container maxWidth="md">
      <Box height="100vh" display="flex" flexDirection="column">
        <Box flex={1} margin={2}>
          {
            history ?
              history.map((entry, entryIndex) => (
                <Entry entry={entry} isFirst={entryIndex === 0} isLatest={entryIndex === history.length - 1} onChooseSuggestion={onChooseSuggestion} onUndo={onUndo} onRetry={onRetry} doScrolldown={doScrolldown} />
              )) : <div />
          }
          <div key="scroll" ref={scrollIntoViewRef}></div>
        </Box>
        <ReactAudioPlayer style={{ width: "100%" }} src={audioSrc} ref={player} listenInterval={LISTEN_INTERVAL} />
        <Snackbar open={errorMessage !== undefined} autoHideDuration={10000} onClose={handleErrorClose}>
          <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
}
