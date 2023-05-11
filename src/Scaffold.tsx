import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import Player from "./Player";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { History, Story } from "./types";
import { Box, Button, Container, CssBaseline, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, FormControl, FormControlLabel, FormGroup, IconButton, InputLabel, List, ListItem, ListItemButton, ListItemText, Menu, MenuItem, Select, SelectChangeEvent, Stack, Switch, TextField, Toolbar, Typography, styled, useTheme } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { Article, Check, ChevronLeft, ChevronRight, Close, Delete, Edit, Image, Menu as MenuIcon, RecordVoiceOver, Settings, Twitter, } from "@mui/icons-material";

export async function loaderEdit(loaderArgs: LoaderFunctionArgs) {
  return { storyId: loaderArgs.params.story, playMode: false };
}

export async function loaderPlay(loaderArgs: LoaderFunctionArgs) {
  return { storyId: loaderArgs.params.story, playMode: true };
}

interface LoaderArgs {
  storyId?: string,
  playMode: boolean
}

const drawerWidth = 240;


interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

export default function Scaffold() {
  const loaderArgs = useLoaderData() as LoaderArgs | undefined;

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const [playMode, setPlayMode] = useState(loaderArgs?.playMode ?? false);

  const [title, setTitle] = useState("");
  const [id, setId] = useState(() => uuidv4());
  const [playerStart, setPlayerStart] = useState<History[]>([]);

  const [landing, setLanding] = useState(true);

  const [library, setLibrary] = useState<Story[]>([]);
  useEffect(() => {
    const storage = localStorage.getItem("library");
    if (storage) {
      const parsed: Story[] = JSON.parse(storage);
      setLibrary(parsed);

      if (loaderArgs && loaderArgs.storyId) {
        const selectedStory = parsed.find(x => x.id === loaderArgs.storyId);
        if (selectedStory) {
          setTitle(selectedStory.title);
          setId(selectedStory.id);
          setPlayerStart(selectedStory.data);
        }
      }
    }
  }, [loaderArgs]);

  const onHistoryChange = useCallback((history: History[]) => {
    if (history.length === 0)
      return;
    if (history[0].chosenSuggestion === undefined)
      return;
    let story = library.find(x => x.id === id);
    if (!story) {
      library.push({
        title: "",
        id: id,
        lastEdited: 0,
        data: []
      });
      story = library[library.length - 1];
    }

    if (!story.title && history.length > 0) {
      story.title = history[0].text.split("\n")[0];
      setTitle(story.title);
    }
    story.lastEdited = Date.now();
    story.data = history;
    localStorage.setItem("library", JSON.stringify(library));
    setLibrary(library);
    setLanding(false);
  }, [library, id]);

  const onSelectFromLibrary = useCallback((index: number) => {
    setTitle(library[index].title);
    setId(library[index].id);
    setPlayerStart(library[index].data);
  }, [library]);

  const [imagineImages, setImagineImages] = useState(2);
  const onImagineImagesChange = useCallback((event: SelectChangeEvent) => {
    setImagineImages(parseInt(event.target.value));
  }, []);

  const [imagineAudio, setImagineAudio] = useState(false);
  const onImagineAudioChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setImagineAudio(event.target.checked);
  }, []);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);
  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const renameTextField = useRef<HTMLTextAreaElement | null>(null);
  const onRenameDialogClose = useCallback(() => {
    setRenameDialogOpen(false);
  }, [renameTextField]);
  const onRenameDialogAccept = useCallback(() => {
    if (renameTextField.current) {
      if (!renameTextField.current.value)
        return;
      let story = library.find(x => x.id === id);
      if (!story)
        return;

      story.title = renameTextField.current.value;
      setTitle(story.title)

      story.lastEdited = Date.now();
      localStorage.setItem("library", JSON.stringify(library));
      setLibrary(library);
    }
    onRenameDialogClose();
  }, [library, id, onRenameDialogClose]);


  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" open={open} sx={{ flexGrow: 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 2, ...(open && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: landing ? 1 : 0 }} textAlign="center">
              {title ? title : "Choose Your Own Adventure"}
            </Typography>
            <IconButton
              color="inherit"
              edge="start"
              sx={{ ml: 3, display: landing ? "none" : "block" }}
              onClick={() => setRenameDialogOpen(true)}
            >
              <Edit />
            </IconButton>
            {/*<IconButton
              color="inherit"
              edge="start"
              sx={{ ml: 1, display: landing ? "none" : "block" }}
            >
              <Delete />
            </IconButton>*/}
            <Box sx={{ flexGrow: landing ? 0 : 1 }} />
            <IconButton
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuClick}
              color="inherit"
            >
              <Settings />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={menuAnchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem>
                <FormGroup>
                  <FormControlLabel
                    disabled={true}
                    control={<Switch checked={imagineAudio}
                      onChange={onImagineAudioChange} />}
                    label={<RecordVoiceOver />}
                  />
                </FormGroup>
              </MenuItem>
              <MenuItem>
                <FormControl fullWidth>
                  <InputLabel><Image id="images-label" /></InputLabel>
                  <Select
                    labelId="images-label"
                    label={<Image />}
                    value={imagineImages.toString()}
                    onChange={onImagineImagesChange}
                  >
                    <MenuItem value={0}>0</MenuItem>
                    <MenuItem value={1}>1</MenuItem>
                    <MenuItem value={2}>2</MenuItem>
                    {/*<MenuItem value={3}>3</MenuItem>
                    <MenuItem value={4}>4</MenuItem>*/}
                  </Select>
                </FormControl>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
          variant="persistent"
          anchor="left"
          open={open}
        >
          <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === 'ltr' ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>
          </DrawerHeader>
          <Divider />
          <List>
            {
              library.sort((a, b) => b.lastEdited - a.lastEdited).map((story, storyIndex) => (
                <ListItem key={story.id} disablePadding>
                  <ListItemButton onClick={() => onSelectFromLibrary(storyIndex)} selected={story.id === id}>
                    <ListItemText
                      primary={story.title}
                      secondary={`${new Date(story.lastEdited).toLocaleDateString()} ${new Date(story.lastEdited).toLocaleTimeString()}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            }
          </List>
        </Drawer>
      </Box>
      <DrawerHeader />
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" paddingTop={2}>
        <Button variant="outlined" startIcon={<Twitter />} component="a" href="https://twitter.com/theemozilla" target="_blank">
          Twitter
        </Button>
        <Button variant="outlined" startIcon={<Article />} component="a" href="https://jeffq.com/blog/choose-your-own-adventure" target="_blank">
          Blog
        </Button>
        <Button variant="outlined" startIcon="🤗" component="a" href="https://huggingface.co/emozilla/scifi-fantasy-author-7b-8k_delta" target="_blank">
          Hugging Face
        </Button>
      </Stack>
      <Player
        playMode={playMode}
        imagineAudio={imagineAudio}
        imagineImages={imagineImages}
        onHistoryChange={onHistoryChange}
        start={playerStart}
      />
      <Dialog open={renameDialogOpen}>
        <DialogTitle>Rename story</DialogTitle>
        <DialogContent>
          <TextField inputRef={renameTextField} autoFocus multiline fullWidth margin="dense" variant="standard" defaultValue={title} />
        </DialogContent>
        <DialogActions>
          <IconButton onClick={onRenameDialogAccept}>
            <Check />
          </IconButton>
          <IconButton onClick={onRenameDialogClose}>
            <Close />
          </IconButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}