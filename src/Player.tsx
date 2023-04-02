import { Alert, Box, Snackbar } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactAudioPlayer from "react-audio-player";
import { fetchJSON } from "./util";
import Entry from "./Entry";
import { History, InitialPrompt, Suggestion } from "./types";
import * as InitialPrompts from "./prompts.json"

const LISTEN_INTERVAL = 33;
const INITIAL_PROMPTS: InitialPrompt[] = InitialPrompts;
const REVEAL_DURATION = 20 * 1000;

export default function Player() {

  const [errorMessage, setErrorMessage] = useState<string>();
  const handleErrorClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorMessage(undefined);
  }, []);

  const player = useRef<ReactAudioPlayer>(null);

  const id = useMemo(() => Date.now().toString(), []);
  const initialPrompt = useMemo(() => INITIAL_PROMPTS[Math.floor(Math.random() * INITIAL_PROMPTS.length)], []);

  const [audioSrc, setAudioSrc] = useState<string>();

  const [history, setHistory] = useState<History[]>();

  useEffect(() => {
    if (history === undefined) {
      setHistory([{
        text: initialPrompt.text,
        lines: initialPrompt.text.split('\n'),
        narrationDuration: REVEAL_DURATION,
        narrationURL: undefined,
        suggestions: [],
        didReveal: false,
      }]);
      return;
    }
    if (history.length === 0 || history[history.length - 1].suggestions.length !== 0)
      return;
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
        const result: Suggestion[] = [];
        for (let i = 0; i < data.results.length; i++) {
          result.push({
            text: data.results[i],
            summary: data.summaries[i]
          });
        }
        setHistory((prev) => {
          if (!prev)
            return [];
          prev[prev.length - 1].suggestions = result;
          return [...prev];
        });
      });
  }, [history, id]);

  const scrollIntoViewRef = useRef<HTMLDivElement>(null);
  const performScrolldown = useRef(false);
  useEffect(() => {
    if (performScrolldown.current) {
      setTimeout(() => scrollIntoViewRef?.current?.scrollIntoView({ behavior: "auto", block: "nearest" }), 500);
    }
    performScrolldown.current = true;
  }, [history]);

  const onChooseSuggestion = useCallback((index: number) => {
    if (history === undefined || history.length === 0 || index >= history[history.length - 1].suggestions.length)
      return;
    setHistory((prev) => {
      if (!prev)
        return [];
      console.log("prev", prev);
      const text = prev[prev.length - 1].suggestions[index].text;
      console.log("text", text);
      return [...prev, {
        text: text,
        lines: text.split('\n'),
        narrationDuration: REVEAL_DURATION,
        narrationURL: undefined,
        suggestions: [],
        didReveal: false
      }];
    });
    // setAudioSrc(`https://api.hooloovoo.ai/tts?text=${encodeURIComponent(suggestions[index].text)}`)
  }, [history]);

  const onUndo = useCallback(() => {
    if (history === undefined || history.length === 0)
      return;
    setHistory((prev) => {
      if (!prev)
        return [];
      prev.pop();
      return [...prev];
    });
  }, [history]);
  
  const onRetry = useCallback(() => {
    if (history === undefined || history.length === 0)
      return;
    setHistory((prev) => {
      if (!prev)
        return [];
      prev[prev.length - 1].suggestions = [];
      return [...prev];
    });
  }, [history]);

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <Box overflow="auto" flex={1} margin={2}>
        {
          history ?
            history.map((entry, entryIndex) => (
              <Entry entry={entry} isFirst={entryIndex === 0} isLatest={entryIndex === history.length - 1} onChooseSuggestion={onChooseSuggestion} onUndo={onUndo} onRetry={onRetry} />
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
  );
}
