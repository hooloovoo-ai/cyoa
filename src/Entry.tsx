import { LooksOneOutlined, LooksTwoOutlined, MoreVert, Replay, SkipPrevious, Undo } from "@mui/icons-material";
import { Avatar, Box, Fade, IconButton, LinearProgress, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { History } from "./types";

export interface EntryParams {
  entry: History,
  isFirst: boolean,
  isLatest: boolean,
  entryIndex: number,
  onChooseSuggestion: (index: number) => void,
  onResetTo: (index: number) => void,
  onRetry: () => void,
  doScrolldown: () => void,
}

interface Reveal {
  start: number,
  end: number,
  percent: number,
}

export default function Entry(params: EntryParams) {
  const [reveal, setReveal] = useState<Reveal>();

  useEffect(() => {
    if (
      params.entry.revealDuration === undefined ||
      !params.isLatest ||
      params.entry.didReveal ||
      params.entry.chosenSuggestion === undefined ||
      params.entry.chosenSuggestion === -1) {
      return;
    }
    setReveal({
      start: Date.now(),
      end: Date.now() + params.entry.revealDuration,
      percent: params.entry.revealDuration === 0 ? 1 : 0,
    });
  }, [params.entry.revealDuration, params.isLatest, params.entry.didReveal, params.entry.chosenSuggestion, params.entryIndex]);

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
          return {
            ...prev,
            percent: percent
          };
        });
      }, 33);
      params.doScrolldown();
    }
  }, [reveal, params]);

  const [imagePlacements, setImagePlacements] = useState<(string | undefined)[]>();

  useEffect(() => {
    if (params.entry.images === undefined || params.entry.images.length === 0 || params.entry.lines === undefined || params.entry.lines.length === 0)
      return;
    const placeEvery = Math.max(1, Math.floor(params.entry.lines.length / params.entry.images.length));
    const ret = [];
    let j = 0;
    let k = 0;
    for (let i = 0; i < params.entry.lines.length; ++i) {
      if (k >= placeEvery) {
        ret.push(params.entry.images[j]);
        j += 1;
        k = 0;
      }
      else {
        k += 1;
        ret.push(undefined);
      }
    }
    let i = params.entry.lines.length - 1;
    while (j < params.entry.images.length) {
      if (ret[i] === undefined) {
        ret[i] = params.entry.images[j];
        j += 1;
      }
      i -= 1;
      if (i < 0)
        break;
    }
    setImagePlacements(ret);
  }, [params.entry.images, params.entry.lines]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  const onMenuResetTo = useCallback((index: number) => {
    handleMenuClose();
    params.onResetTo(index);
  }, [params, handleMenuClose]);
  const onMenuRetry = useCallback(() => {
    handleMenuClose();
    params.onRetry();
  }, [params, handleMenuClose]);

  let linesToShow = params.entry.lines;
  let unfaded = "";
  let fadeChars: string[] = [];

  if (reveal) {
    if (reveal.percent < 1) {
      linesToShow = [];
      let charsLeft = Math.floor(reveal.percent * params.entry.text.length);
      for (let i = 0; i < params.entry.lines.length; ++i) {
        const line = params.entry.lines[i];
        linesToShow.push(line.substring(0, charsLeft));
        charsLeft -= linesToShow[i].length;
        if (charsLeft === 0)
          break;
      }
      const fadeLine = linesToShow.pop() ?? "";
      const charsToFade = Math.min(5, fadeLine.length);
      const unfadedLength = fadeLine.length - charsToFade;
      unfaded = fadeLine.substring(0, unfadedLength);
      fadeChars = fadeLine.substring(unfadedLength).split("");
    } else {
      params.entry.didReveal = true;
    }
  }

  return (<Paper elevation={3}>
    <Box paddingX={2} paddingY={1} marginY={1}>
      {
        params.entry.suggestions.length > 0 && ! params.isFirst
          ? (
            <Stack alignItems="end">
              <IconButton onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
              {
                params.isLatest
                  ? (
                    <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
                      <MenuItem onClick={() => onMenuResetTo(params.entryIndex - 1)}>
                        <ListItemIcon>
                          <Undo />
                        </ListItemIcon>
                        <ListItemText>Undo</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={onMenuRetry}>
                        <ListItemIcon>
                          <Replay />
                        </ListItemIcon>
                        <ListItemText>Retry</ListItemText>
                      </MenuItem>
                    </Menu>
                  )
                  : (
                    <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
                      <MenuItem onClick={() => onMenuResetTo(params.entryIndex)}>
                        <ListItemIcon>
                          <SkipPrevious />
                        </ListItemIcon>
                        <ListItemText>Reset to Here</ListItemText>
                      </MenuItem>
                    </Menu>
                  )
              }
            </Stack>
          )
          : params.isFirst ? <div /> : <LinearProgress color="secondary" sx={{ width: "100%" }} />
      }
      <Fade in={true} timeout={1000}>
        {
          params.entry.suggestions.length > 0 && params.isLatest
            ? (
              <Fade in={params.isLatest} timeout={1000}>
                <List style={{ "width": "100%" }}>
                  {
                    params.entry.suggestions.map((suggestion, suggestionIndex) => (
                      <ListItem key={suggestionIndex} sx={{ "opacity": params.entry.chosenSuggestion !== undefined && suggestionIndex !== params.entry.chosenSuggestion ? "30%" : "100%" }}>
                        <ListItemAvatar>
                          <Avatar>
                            <IconButton onClick={() => params.onChooseSuggestion(suggestionIndex)}>
                              {
                                suggestionIndex === 0 ? <LooksOneOutlined /> : <LooksTwoOutlined />
                              }
                            </IconButton>
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={suggestion.summary} />
                      </ListItem>
                    ))
                  }
                </List>
              </Fade>
            )
            : <div />
        }
      </Fade>
      {
        !params.isLatest || reveal // wait until reveal is set by useEffect (prevent flashing)
          ? linesToShow.map((line, lineIndex) => (
            imagePlacements !== undefined
              ? (
                imagePlacements[lineIndex]
                  ? (
                    <div>
                      <p key={lineIndex}>{line}</p>
                      <Stack>
                        <Fade in={true} timeout={2000}>
                          <img src={imagePlacements[lineIndex]} alt="" />
                        </Fade>
                      </Stack>
                    </div>
                  )
                  : <p key={lineIndex}>{line}</p>
              )
              : <p key={lineIndex}>{line}</p>
          )
          )
          : (params.entry.chosenSuggestion !== undefined ? <LinearProgress color="secondary" sx={{ width: "100%" }} /> : <div />)
      }
      {
        reveal // wait until reveal is set by useEffect (prevent flashing)
          ? (
            <p key={linesToShow.length}>
              {unfaded}
              {fadeChars.map((char, index) => (<span style={{ "opacity": 1 - ((index + 1) / fadeChars.length) }}>{char}</span>))}
            </p>)
          : <div />
      }
      {
        params.isLatest && params.entry.didReveal && !params.entry.editing
          ? (<LinearProgress color="secondary" sx={{ width: "100%" }} />)
          : <div />
      }
    </Box>
  </Paper>);
}
