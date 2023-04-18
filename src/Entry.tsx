import { Check, Close, Edit, EditOutlined, LooksOneOutlined, LooksTwoOutlined, MoreVert, Replay, SkipPrevious, Undo } from "@mui/icons-material";
import { Avatar, Box, Dialog, DialogActions, DialogContent, DialogTitle, Fade, IconButton, LinearProgress, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, TextField, useMediaQuery, useTheme } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { History } from "./types";

export interface EntryParams {
  entry: History,
  isFirst: boolean,
  isLatest: boolean,
  entryIndex: number,
  onChooseSuggestion: (index: number) => void,
  onResetTo: (index: number) => void,
  onRetry: () => void,
  onEdit: (entryIndex: number, text: string) => void,
  onRevealFinished: (entryIndex: number) => void,
}

interface Reveal {
  start: number,
  end: number,
  percent: number,
  lastScrollDown: number
}

export default function Entry(params: EntryParams) {
  const [reveal, setReveal] = useState<Reveal>();

  useEffect(() => {
    if (
      params.entry.revealDuration === undefined ||
      !params.isLatest ||
      params.entry.didReveal ||
      params.entry.chosenSuggestion === undefined) {
      return;
    }
    setReveal({
      start: Date.now(),
      end: Date.now() + params.entry.revealDuration,
      percent: params.entry.revealDuration === 0 ? 1 : 0,
      lastScrollDown: Date.now(),
    });
  }, [params.entry.revealDuration, params.isLatest, params.entry.didReveal, params.entry.chosenSuggestion, params.entryIndex]);

  const scrollIntoViewRef = useRef<HTMLDivElement>(null);
  const performScrolldown = useRef(false);
  const doScrolldown = useCallback(() => setTimeout(() => scrollIntoViewRef?.current?.scrollIntoView({ behavior: "auto", block: "nearest" }), 1), []);
  useEffect(() => {
    if (performScrolldown.current) {
      doScrolldown();
    }
    performScrolldown.current = true;
  }, [doScrolldown]);

  const [enableAutoScroll, setEnableAutoScroll] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const [pageYOffset, setPageYOffset] = useState(0);
  const [previousPageYOffset, setPreviousPageYOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setPageYOffset(window.pageYOffset);
      setAtBottom((window.innerHeight + window.pageYOffset) >= document.body.scrollHeight - 2);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (pageYOffset < previousPageYOffset) {
      setEnableAutoScroll(false);
    } else if (atBottom && !enableAutoScroll) {
      setEnableAutoScroll(true);
    }
    setPreviousPageYOffset(pageYOffset);
  }, [pageYOffset, atBottom, previousPageYOffset, enableAutoScroll]);

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

          let lastScrollDown = prev.lastScrollDown;
          if (Date.now() - lastScrollDown >= 500) {
            if (enableAutoScroll) {
              doScrolldown();
              lastScrollDown = Date.now();
            }
          }

          return {
            ...prev,
            percent: percent,
            lastScrollDown: lastScrollDown
          };
        });
      }, 33);
    }
  }, [reveal, doScrolldown, enableAutoScroll]);

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

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchorEl);
  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);
  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);
  const onMenuResetTo = useCallback((index: number) => {
    handleMenuClose();
    params.onResetTo(index);
  }, [params, handleMenuClose]);
  const onMenuRetry = useCallback(() => {
    handleMenuClose();
    params.onRetry();
  }, [params, handleMenuClose]);

  const theme = useTheme();
  const dialogFullscreen = useMediaQuery(theme.breakpoints.down('md'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingText, setPendingText] = useState(() => params.entry.text);
  const textField = useRef<HTMLTextAreaElement | null>(null);
  const onDialogClose = useCallback(() => {
    if (textField.current)
      setPendingText(textField.current.value);
    handleMenuClose();
    setDialogOpen(false);
  }, [textField]);
  const onDialogAccept = useCallback(() => {
    if (textField.current)
      params.onEdit(params.entryIndex, textField.current.value);
    onDialogClose();
  }, [params, onDialogClose]);

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
    } else if (!params.entry.didReveal) {
      params.onRevealFinished(params.entryIndex);
      // hack for showing image at the end that might not be scrolled to
      if (enableAutoScroll) {
        setTimeout(doScrolldown, 500);
      }
    }
  }

  return (<Paper elevation={3}>
    <Box paddingX={2} paddingY={1} marginY={1}>
      {
        params.entry.suggestions.length > 0 && !params.isFirst
          ? (
            <Stack alignItems="end">
              <IconButton onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
              {
                params.isLatest
                  ? (
                    <Menu anchorEl={menuAnchorEl} open={menuOpen} onClose={handleMenuClose}>
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
                    <Menu anchorEl={menuAnchorEl} open={menuOpen} onClose={handleMenuClose}>
                      <MenuItem onClick={() => setDialogOpen(true)}>
                        <ListItemIcon>
                          <Edit />
                        </ListItemIcon>
                        <ListItemText>Edit</ListItemText>
                      </MenuItem>
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
      <List style={{ "width": "100%" }}>
        {
          params.entry.suggestions.map((suggestion, suggestionIndex) => (
            params.entry.chosenSuggestion === suggestionIndex || params.isLatest
              ? (
                <ListItem key={suggestionIndex} sx={{ "opacity": !params.isLatest || (params.entry.chosenSuggestion !== undefined && suggestionIndex !== params.entry.chosenSuggestion) ? "30%" : "100%" }}>
                  <ListItemAvatar>
                    <Avatar>
                      <IconButton disabled={params.entry.chosenSuggestion !== undefined || !params.isLatest} onClick={() => params.onChooseSuggestion(suggestionIndex)}>
                        {
                          suggestionIndex === 0 ? <LooksOneOutlined /> : <LooksTwoOutlined />
                        }
                      </IconButton>
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={suggestion.summary} />
                </ListItem>
              )
              : <div />
          ))
        }
        {
          params.entry.chosenSuggestion === -1 || (params.isLatest && params.entry.suggestions.length > 0)
            ? (
              <ListItem key={-1} sx={{ "opacity": !params.isLatest || (params.entry.chosenSuggestion !== undefined && -1 !== params.entry.chosenSuggestion) ? "30%" : "100%" }}>
                <ListItemAvatar>
                  <Avatar>
                    <IconButton disabled={params.entry.chosenSuggestion !== undefined || !params.isLatest} onClick={() => setDialogOpen(true)}>
                      <EditOutlined />
                    </IconButton>
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary="Write your own!" />
              </ListItem>
            )
            : <div />
        }
      </List>
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
    <div key="scroll" ref={scrollIntoViewRef}></div>
    <Dialog open={dialogOpen} fullScreen={dialogFullscreen} fullWidth>
      <DialogTitle>Write your own story</DialogTitle>
      <DialogContent>
        <TextField inputRef={textField} autoFocus multiline fullWidth margin="dense" variant="standard" defaultValue={pendingText} />
      </DialogContent>
      <DialogActions>
        <IconButton onClick={onDialogAccept}>
          <Check />
        </IconButton>
        <IconButton onClick={onDialogClose}>
          <Close />
        </IconButton>
      </DialogActions>
    </Dialog>
  </Paper>);
}
