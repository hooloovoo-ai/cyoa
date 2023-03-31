import { Alert, AppBar, Avatar, Box, Fade, IconButton, List, ListItem, ListItemAvatar, ListItemText, MenuItem, Select, SelectChangeEvent, Snackbar, Stack, Theme, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router-dom";
import deepEqual from "deep-equal";
import ReactAudioPlayer from "react-audio-player";
import { fetchJSON } from "./util";
import { ArrowBack, CheckCircle, FolderSpecialOutlined, Looks3Outlined, LooksOne, LooksOneOutlined, LooksTwoOutlined } from "@mui/icons-material";

const LISTEN_INTERVAL = 33;

interface Suggestion {
  text: string,
  summary: string
}

interface History {
  rawBook: string,
  suggestions: Suggestion[]
}

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
  const [rawBook, setRawBook] = useState("A Memory of Fire\nJeffrey Quesnelle\n\nPROLOGUE\nThe last of the stones had been toppled long ago, but that didn't stop Tomin from letting his fingers wistfully graze the cold ground as if his mere touch could resurrect the once-great hall that was now nothing more than a slightly smoother patch of arid land. His memories of the hall were hazy, as if coming to him from a long-lost dream; the more he focused on them the quicker they seemed to melt away.");

  const [suggestions, setSuggestions] = useState<Suggestion[]>();

  useEffect(() => {
    if (suggestions === undefined) {
      setSuggestions([]);
      return;
    }
    if (suggestions.length !== 0)
      return;
    const args = {
      'id': id,
      'text': rawBook,
      'chunk': 0,
      'totalChunks': 1,
      'temperature': 0.8,
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
          setSuggestions(result);
        });
  }, [suggestions, rawBook, id]);

  const [bookLines, setBookLines] = useState<string[]>([]);
  useEffect(() => {
    setBookLines(() => rawBook.split('\n'));
  }, [rawBook]);

  const scrollIntoViewRef = useRef<HTMLDivElement>(null);
  const performScrolldown = useRef(false);
  useEffect(() => {
    if (performScrolldown.current) {
      setTimeout(() => scrollIntoViewRef?.current?.scrollIntoView({ behavior: "auto", block: "nearest" }), 500);
    }
    performScrolldown.current = true;
  }, [bookLines]);

  const [history, setHistory] = useState<History[]>([]);

  const onChooseSuggestion = useCallback((index: number) => {
    if (suggestions === undefined || index >= suggestions.length)
      return;
    setHistory((prev) => [...prev, {
      rawBook: rawBook,
      suggestions: suggestions
    }]);
    setRawBook((prev) => prev + suggestions[index].text);
    // setAudioSrc(`https://api.hooloovoo.ai/tts?text=${encodeURIComponent(suggestions[index].text)}`)
    setSuggestions([]);
  }, [rawBook, suggestions]);

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column">
      <Box overflow="auto" flex={3} margin={2}>
        {
          bookLines.map(line => (<p>{line}</p>))
        }
        <div key="scroll" ref={scrollIntoViewRef}></div>
      </Box>
      <Box overflow="auto" flex={1} margin={2}>
        <List>
          {
            suggestions ? 
              suggestions.map((suggestion, index) => (
                <ListItem secondaryAction={
                  <IconButton edge="end" onClick={() => onChooseSuggestion(index)}>
                    <CheckCircle />
                  </IconButton>
                }>
                  <ListItemAvatar>
                    <Avatar>
                      {
                        index === 0 ? <LooksOneOutlined /> : (index === 1 ? <LooksTwoOutlined /> : <Looks3Outlined />)
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
      <ReactAudioPlayer style={{ width: "100%" }} src={audioSrc} ref={player} listenInterval={LISTEN_INTERVAL} controls/>
      <Snackbar open={errorMessage !== undefined} autoHideDuration={10000} onClose={handleErrorClose}>
        <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
