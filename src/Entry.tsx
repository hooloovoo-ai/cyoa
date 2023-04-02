import { CheckCircle, Looks3Outlined, LooksOneOutlined, LooksTwoOutlined } from "@mui/icons-material";
import { Avatar, Box, CircularProgress, IconButton, List, ListItem, ListItemAvatar, ListItemText, Paper } from "@mui/material";
import { History } from "./types"

export interface EntryParams {
  entry: History,
  isLatest: boolean,
  onChooseSuggestion: (index: number) => void
}

export default function Entry(params: EntryParams) {
  return (<Paper elevation={3}>
    <Box paddingX={2} paddingY={1} marginY={1}>
      {params.entry.lines.map(line => (<p>{line}</p>))}
      <List>
        {
          params.isLatest ?
            params.entry.suggestions.length === 0 ?
              (<CircularProgress color="secondary" />) :
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
            : <div />
        }
      </List>
    </Box>
  </Paper>);
}
