import { Alert, AppBar, Avatar, Box, CircularProgress, Fade, IconButton, List, ListItem, ListItemAvatar, ListItemText, MenuItem, Paper, Select, SelectChangeEvent, Snackbar, Stack, Theme, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router-dom";
import deepEqual from "deep-equal";
import ReactAudioPlayer from "react-audio-player";
import { fetchJSON } from "./util";
import { ArrowBack, CheckCircle, FolderSpecialOutlined, Looks3Outlined, LooksOne, LooksOneOutlined, LooksTwoOutlined } from "@mui/icons-material";
import { padding } from "@mui/system";

const LISTEN_INTERVAL = 33;

interface Suggestion {
  text: string,
  summary: string
}

interface History {
  text: string,
  lines: string[],
  suggestions: Suggestion[]
}

const INITIAL_PROMPT = "A Memory of Fire\nJeffrey Quesnelle\n\nPROLOGUE\nThe last of the stones had been toppled long ago, but that didn't stop Tomin from letting his fingers wistfully graze the cold ground as if his mere touch could resurrect the once-great hall that was now nothing more than a slightly smoother patch of arid land. His memories of the hall were hazy, as if coming to him from a long-lost dream; the more he focused on them the quicker they seemed to melt away.\n\nHe was sure of one thing, though. The Great Hall of Porice had been home to the Emerald Chair. He wasn't sure why that was important, but the clarity of the thought was in such contrast to his other vague recollections that he knew it must be true.";

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

  const [audioSrc, setAudioSrc] = useState<string>();

  const [history, setHistory] = useState<History[]>();

  useEffect(() => {
    if (history === undefined) {
      setHistory([{
        text: INITIAL_PROMPT,
        lines: INITIAL_PROMPT.split('\n'),
        suggestions: [],
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
      'generations': 3,
      'summarize': true,
    };
    fetchJSON("https://api.hooloovoo.ai/generate", {
        method: "POST",
        cache: "no-cache",
        headers: {"Content-Type": "application/json"},
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
      const text = prev[prev.length - 1].suggestions[index].text;
      return [...prev, {
        text: text,
        lines: text.split('\n'),
        suggestions: []
      }];
    });
    // setAudioSrc(`https://api.hooloovoo.ai/tts?text=${encodeURIComponent(suggestions[index].text)}`)
  }, [history]);

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <Box overflow="auto" flex={1} margin={2}>
        {
          history ? 
            history.map((entry, entryIndex) => (
              <Paper elevation={3}>
                <Box paddingX={2} paddingY={1} marginY={1}>
                  {entry.lines.map(line => (<p>{line}</p>))}
                  <List>
                    {
                      entryIndex === history.length - 1 ?
                        entry.suggestions.length === 0 ?
                          (<CircularProgress color="secondary"/>) :
                          entry.suggestions.map((suggestion, suggestionIndex) => (
                            <ListItem secondaryAction={
                              <IconButton edge="end" onClick={() => onChooseSuggestion(suggestionIndex)}>
                                <CheckCircle />
                              </IconButton>
                            }>
                              <ListItemAvatar>
                                <Avatar>
                                  {
                                    suggestionIndex === 0 ? <LooksOneOutlined /> : (suggestionIndex === 1 ? <LooksTwoOutlined /> : <Looks3Outlined />)
                                  }
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText primary={suggestion.summary} />
                            </ListItem>
                          ))
                          : <div/>
                    }
                  </List>
                </Box>
              </Paper>
            )) : <div />
        }
        <div key="scroll" ref={scrollIntoViewRef}></div>
      </Box>
      <ReactAudioPlayer style={{ width: "100%" }} src={audioSrc} ref={player} listenInterval={LISTEN_INTERVAL}/>
      <Snackbar open={errorMessage !== undefined} autoHideDuration={10000} onClose={handleErrorClose}>
        <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
