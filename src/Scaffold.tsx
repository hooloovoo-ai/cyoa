import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import Player from "./Player";
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { History, Story } from "./types";
import { Box, Container, CssBaseline, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography, styled, useTheme } from "@mui/material";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { ChevronLeft, ChevronRight, Menu } from "@mui/icons-material";

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
    console.log("onHistoryChange", history);
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
    }
    story.lastEdited = Date.now();
    story.data = history;
    localStorage.setItem("library", JSON.stringify(library));
  }, [library, id]);

  const onSelectFromLibrary = useCallback((index: number) => {
    setTitle(library[index].title);
    setId(library[index].id);
    setPlayerStart(library[index].data);
  }, [library]);

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" open={open}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{ mr: 2, ...(open && { display: 'none' }) }}
            >
              <Menu />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {title ? title : "Choose Your Own Adventure"}
            </Typography>
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
              library.map((story, storyIndex) => (
                <ListItem key={story.id} disablePadding>
                  <ListItemButton onClick={() => onSelectFromLibrary(storyIndex)}>
                    <ListItemText
                      primary={story.title}
                      secondary={`Edited: ${new Date(story.lastEdited).toLocaleTimeString()} ${new Date(story.lastEdited).toLocaleDateString()}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            }
          </List>
        </Drawer>
      </Box>
      <DrawerHeader />
      <Player playMode={playMode} onHistoryChange={onHistoryChange} start={playerStart} />
    </Container>
  );
}