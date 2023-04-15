import { Alert, Box, Snackbar } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactAudioPlayer from "react-audio-player";
import { fetchJSON } from "./util";
import Entry from "./Entry";
import { History, InitialPrompt, Suggestion } from "./types";
import { default as InitialPrompts } from "./prompts.json";

const LISTEN_INTERVAL = 33;
const DEFAULT_REVEAL_DURATION = 45 * 1000;
const INITIAL_PROMPTS: InitialPrompt[] = InitialPrompts.prompts;

export interface PlayerParams {
  playMode: boolean,
  start?: History[],
  onHistoryChange: ((story: History[]) => void)
}

export default function Player(params: PlayerParams) {

  const [errorMessage, setErrorMessage] = useState<string>();
  const handleErrorClose = useCallback((event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setErrorMessage(undefined);
  }, []);

  const player = useRef<ReactAudioPlayer>(null);
  const [audioSrc, setAudioSrc] = useState<string>();

  const [history, setHistory] = useState<History[]>([]);
  useEffect(() => {
    params.onHistoryChange(history);
  }, [history, params]);

  useEffect(() => {
    setHistory(params.start && params.start.length > 0 ? params.start : [{
      text: "",
      lines: [],
      revealDuration: 0,
      suggestions: INITIAL_PROMPTS.map(prompt => ({
        text: prompt.text,
        summary: `${prompt.genre}: ${prompt.title}`
      })),
      didReveal: false,
      editing: false,
      chosenSuggestion: undefined,
      audio: undefined,
      images: undefined
    }]);
  }, [params.start]);

  const id = useMemo(() => Date.now().toString(), []);
  const suggest = useCallback((retry: boolean) => {
    const args = {
      'id': id,
      'text': history.reduce((prev, curr) => prev + curr.text, ""),
      'chunk': 0,
      'totalChunks': 10,
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
              revealDuration: undefined,
              suggestions: suggestions,
              didReveal: false,
              editing: false,
              chosenSuggestion: undefined,
              audio: undefined,
              images: undefined
            }];
          }
        });
      });
  }, [history, id]);

  const onChooseSuggestion = useCallback((index: number) => {
    const lastIndex = history.length - 1;
    if (history[lastIndex].chosenSuggestion !== index) {
      const args = {
        'text': index === -1 ? history[lastIndex].text : history[lastIndex].suggestions[index].text,
      };
      fetchJSON("https://api.hooloovoo.ai/imagine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args)
      })
        .catch(err => setErrorMessage(err.toString()))
        .then(data => {
          if (!data)
            return;
          setHistory((prev) => {
            if (data.audio !== undefined && data.audio.url.length > 0 && data.audio.duration > 0) {
              prev[lastIndex].revealDuration = Math.floor(data.audio.duration * 1000);
              prev[lastIndex].audio = data.audio;
              setAudioSrc(data.audio.url);
            } else {
              prev[lastIndex].revealDuration = DEFAULT_REVEAL_DURATION;
            }
            prev[lastIndex].images = data.images;
            return [...prev];
          });
        });
      setHistory((prev) => {
        const last = prev[lastIndex];
        if (index >= 0 && index < last.suggestions.length)
          last.text = last.suggestions[index].text;
        last.lines = last.text.split("\n");
        last.revealDuration = undefined;
        last.didReveal = false;
        last.audio = undefined;
        last.images = undefined;
        last.chosenSuggestion = index;
        last.editing = false;
        return [...prev];
      });
    } else {
      setHistory((prev) => {
        const last = prev[lastIndex];
        last.editing = false;
        return [...prev];
      });
    }
    suggest(false);
  }, [suggest, history]);

  const onResetTo = useCallback((index: number) => {
    setHistory((prev) => {
      prev.splice(index + 1);
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

  const onEdit = useCallback((index: number, text: string) => {
    history[index].text = text;
    onChooseSuggestion(-1);
  }, [history, onChooseSuggestion]);

  const onRevealFinished = useCallback((index: number) => {
    history[index].didReveal = true;
    params.onHistoryChange(history);
  }, [history, params]);

  return (
      <Box display="flex" flexDirection="column">
        <Box flex={1} margin={2}>
          {
            history ?
              history.map((entry, entryIndex) => (
                <Entry
                  entry={entry}
                  isFirst={entryIndex === 0}
                  isLatest={entryIndex === history.length - 1}
                  entryIndex={entryIndex}
                  onChooseSuggestion={onChooseSuggestion}
                  onResetTo={onResetTo}
                  onRetry={onRetry}
                  onEdit={onEdit}
                  onRevealFinished={onRevealFinished}
                />
              )) : <div />
          }
        </Box>
        <ReactAudioPlayer style={{ width: "100%" }} src={audioSrc} ref={player} listenInterval={LISTEN_INTERVAL} autoPlay />
        <Snackbar open={errorMessage !== undefined} autoHideDuration={10000} onClose={handleErrorClose}>
          <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
  );
}
