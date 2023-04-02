import { CheckCircle, Looks3Outlined, LooksOneOutlined, LooksTwoOutlined, Replay, Undo } from "@mui/icons-material";
import { Avatar, Box, Fade, IconButton, LinearProgress, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { History } from "./types";

export interface EntryParams {
  entry: History,
  isFirst: boolean,
  isLatest: boolean,
  onChooseSuggestion: (index: number) => void,
  onUndo: () => void,
  onRetry: () => void,
}

interface Reveal {
  start: number,
  end: number,
  percent: number,
}

export default function Entry(params: EntryParams) {
  const [reveal, setReveal] = useState<Reveal>();

  useEffect(() => {
    if (params.entry.narrationDuration === undefined || !params.isLatest || params.entry.didReveal)
      return;
    setReveal({
      start: Date.now(),
      end: Date.now() + params.entry.narrationDuration,
      percent: params.entry.narrationDuration === 0 ? 1 : 0,
    });
  }, [params.entry.narrationDuration, params.isLatest]);

  useEffect(() => {
    if (!reveal)
      return;

    if (reveal.percent < 1) {
      setTimeout(() => {
        setReveal((prev) => {
          if (!prev)
            return prev;
          const duration = prev.end - prev.start;
          const elapsed = Date.now() - prev.start;
          const percent = Math.min(1, elapsed / duration);
          console.log("percent", percent);
          return {
            ...prev,
            percent: percent
          };
        });
      }, 33);
    }
  }, [reveal]);

  if (params.isLatest) {
    if (params.entry.narrationDuration === undefined || reveal === undefined) {
      return (<Paper elevation={3}><LinearProgress sx={{ "width": "100%" }} /></Paper>);
    } 

    if (reveal.percent < 1) {
      const linesToShow = [];
      let charsLeft = Math.floor(reveal.percent * params.entry.text.length);
      for (let i = 0 ; i < params.entry.lines.length ; ++i) {
        const line = params.entry.lines[i];
        linesToShow.push(line.substring(0, charsLeft));
        charsLeft -= linesToShow[i].length;
        if (charsLeft === 0)
          break;
      }
      const fadeLine = linesToShow.pop() ?? "";
      const charsToFade = Math.min(5, fadeLine.length);
      const unfadedLength = fadeLine.length - charsToFade;
      const unfaded = fadeLine.substring(0, unfadedLength);
      const fadeChars = fadeLine.substring(unfadedLength).split("");
      return (
        <Paper elevation={3}>
          <Box paddingX={2} paddingY={1} marginY={1}>
            {linesToShow.map((line, lineIndex) => (<p key={lineIndex}>{line}</p>))}
            {
              <p key={linesToShow.length}>
                {unfaded}
                {fadeChars.map((char, index) => (<span style={{"opacity": 1 - ((index + 1) / fadeChars.length)}}>{char}</span>))}
              </p>
            }
          </Box>
        </Paper>);
    } else {
      params.entry.didReveal = true;
    }
  }

  return (<Paper elevation={3}>
    <Box paddingX={2} paddingY={1} marginY={1}>
      {params.entry.lines.map((line, lineIndex) => (<p key={lineIndex}>{line}</p>))}
      <Fade in={true} timeout={1000}>
        <Stack direction="row">
          {
            params.isLatest && params.entry.suggestions.length > 0
              ? (
                <Stack justifyContent="center" alignItems="center" spacing={3}>
                  {
                    params.isFirst ?
                      <div /> :
                      (
                        <IconButton aria-label="undo" onClick={params.onUndo}>
                          <Undo />
                        </IconButton>
                      )
                  }
                  <IconButton aria-label="retry" onClick={params.onRetry}>
                    <Replay />
                  </IconButton>
                </Stack>
              )
              : <div />
          }
          {
            params.isLatest ?
              params.entry.suggestions.length === 0
                ? (<LinearProgress color="secondary" sx={{ width: "100%" }} />)
                : (
                  <List>
                    {
                      params.entry.suggestions.map((suggestion, suggestionIndex) => (
                        <ListItem key={suggestionIndex} secondaryAction={
                          <IconButton edge="end" onClick={() => params.onChooseSuggestion(suggestionIndex)}>
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
                    }
                  </List>
                )
              : <div />
          }
        </Stack>
      </Fade>
    </Box>
  </Paper>);
}
