import { CheckCircle, Looks3Outlined, LooksOneOutlined, LooksTwoOutlined, Replay, Undo } from "@mui/icons-material";
import { Avatar, Box, IconButton, LinearProgress, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack } from "@mui/material";
import { History } from "./types"

export interface EntryParams {
  entry: History,
  isFirst: boolean,
  isLatest: boolean,
  onChooseSuggestion: (index: number) => void,
  onUndo: () => void,
  onRetry: () => void,
}

export default function Entry(params: EntryParams) {
  return (<Paper elevation={3}>
    <Box paddingX={2} paddingY={1} marginY={1}>
      {params.entry.lines.map(line => (<p>{line}</p>))}
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
              ? (<LinearProgress color="secondary" sx={{width: "100%"}}/>)
              : (
                <List>
                  {
                    params.entry.suggestions.map((suggestion, suggestionIndex) => (
                      <ListItem secondaryAction={
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
    </Box>
  </Paper>);
}
