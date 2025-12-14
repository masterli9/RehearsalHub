import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAudioPlayer, AudioModule } from "expo-audio";

type PlayableAudio = {
    song_id: number;
    title: string;
    url: string;
    type: "song" | "idea";
};

type PlayerState = {
    current: PlayableAudio | null;
    isPlaying: boolean;
    play: (song: PlayableAudio) => void;
    pause: () => void;
    stop: () => void;
    resume: () => void;
    player: any;
    clearCurrent: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentAudio, setCurrentAudio] = useState<PlayableAudio | null>(
        null
    );

    const player = useAudioPlayer(currentAudio?.url);

    const [isPlaying, setIsPlaying] = useState(false);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        hasStartedRef.current = false;
    }, [currentAudio]);

    useEffect(() => {
        async function configureAudio() {
            try {
                await AudioModule.setAudioModeAsync({
                    playsInSilentMode: true,
                    shouldPlayInBackground: true,
                    interruptionMode: "duckOthers",
                    interruptionModeAndroid: "duckOthers",
                    shouldRouteThroughEarpiece: false,
                });
            } catch (e) {
                console.error("Failed to configure audio:", e);
            }
        }
        configureAudio();
    }, []);
    useEffect(() => {
        if (!currentAudio || !player) return;

        const subscription = player.addListener(
            "playbackStatusUpdate",
            (status) => {
                // console.log("Status update:", status);
                if (status.didJustFinish) {
                    stop();
                    // clearCurrent();
                }
            }
        );

        if (!hasStartedRef.current) {
            const timer = setTimeout(() => {
                // console.log("Attempting play...");
                player.play();
                player.volume = 1.0;
                setIsPlaying(true);
                hasStartedRef.current = true;
            }, 500);

            return () => clearTimeout(timer);
        }

        return () => subscription.remove();
    }, [currentAudio, player]);

    const play = (audio: PlayableAudio) => {
        if (audio.song_id === currentAudio?.song_id) {
            resume();
        } else {
            setCurrentAudio(audio);
        }
    };

    const pause = () => {
        player.pause();
        setIsPlaying(false);
    };

    const resume = () => {
        player.play();
        setIsPlaying(true);
    };

    const stop = () => {
        player.pause();
        player.seekTo(0);
        setIsPlaying(false);
    };

    const clearCurrent = () => {
        player.pause();
        player.seekTo(0);
        setIsPlaying(false);
        setCurrentAudio(null); // This effectively "closes" the player UI
    };

    return (
        <PlayerContext.Provider
            value={{
                current: currentAudio,
                play,
                pause,
                stop,
                resume,
                isPlaying,
                player,
                clearCurrent,
            }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error("usePlayer has to be called inside PlayerProvider");
    }
    return context;
};
