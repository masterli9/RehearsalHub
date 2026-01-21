import { AudioModule, useAudioPlayer } from "expo-audio";
import { createContext, useContext, useEffect, useRef, useState } from "react";

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
    const playerRef = useRef(player);
    
    // Keep playerRef in sync with player
    useEffect(() => {
        playerRef.current = player;
    }, [player]);

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
                if (player) {
                    try {
                        player.play();
                        player.volume = 1.0;
                        setIsPlaying(true);
                        hasStartedRef.current = true;
                    } catch (e) {
                        console.error("Error starting playback:", e);
                    }
                }
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
        const currentPlayer = playerRef.current;
        if (currentPlayer) {
            try {
                currentPlayer.pause();
            } catch (e) {
                console.error("Error pausing player:", e);
            }
        }
        setIsPlaying(false);
    };

    const resume = () => {
        const currentPlayer = playerRef.current;
        if (currentPlayer) {
            try {
                currentPlayer.play();
                setIsPlaying(true);
            } catch (e) {
                console.error("Error resuming player:", e);
            }
        }
    };

    const stop = () => {
        const currentPlayer = playerRef.current;
        if (currentPlayer) {
            try {
                currentPlayer.pause();
                // Only seekTo if player is still valid
                if (currentPlayer && typeof currentPlayer.seekTo === 'function') {
                    currentPlayer.seekTo(0);
                }
            } catch (e) {
                // Player might be released, ignore silently
                // Error is already caught by try-catch
            }
        }
        setIsPlaying(false);
    };

    const clearCurrent = () => {
        // Don't call seekTo when clearing - just pause if possible
        const currentPlayer = playerRef.current;
        if (currentPlayer) {
            try {
                currentPlayer.pause();
                // Don't call seekTo here - player will be released anyway
            } catch (e) {
                // Player might be released, ignore silently
                console.error("Error clearing player:", e);
            }
        }
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
