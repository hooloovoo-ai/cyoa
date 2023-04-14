import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import Player, { PlayerParams } from "./Player";
import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { History, Story } from "./types";

export async function loader(loaderArgs: LoaderFunctionArgs) {
    return { storyId: loaderArgs.params.story ?? "", playMode: true };
}

export default function Scaffold() {
    const loaderData = useLoaderData() as PlayerParams | undefined;
    
    const [story, setStory] = useState<Story>({
        title: "",
        id: uuidv4(),
        data: []
    });

    const [library, setLibrary] = useState<Story[]>([]);
    useEffect(() => {
        const storage = localStorage.getItem("library");
        if (storage) {
            const parsed = JSON.parse(storage);
            setLibrary(parsed);
        }
    }, []);

    const onHistoryChange = useCallback((history: History[]) => {

    }, []);

    return (
        <Player playMode={false} onHistoryChange={onHistoryChange} />
    );
}