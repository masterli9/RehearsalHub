import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    useColorScheme,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Play, Pause, X } from "lucide-react-native";
import { usePlayer } from "@/context/AudioPlayerContext";
import { usePathname } from "expo-router";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";

const MiniPlayer = () => {
    const { current, isPlaying, pause, resume, player, clearCurrent } =
        usePlayer();
    const pathname = usePathname(); // Get current route
    const colorScheme = useColorScheme();
    const fontSize = useAccessibleFontSize();

    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(1); // Avoid div by zero
    const [isSliding, setIsSliding] = useState(false);

    // List of routes where the player should be HIDDEN
    const hiddenRoutes = ["/chat", "/login", "/camera"];
    const shouldHide = hiddenRoutes.some((route) => pathname.startsWith(route));

    // 1. Loop to update the progress bar UI
    useEffect(() => {
        if (!player || !isPlaying) return;

        // Update every 500ms for smooth-ish UI
        const interval = setInterval(() => {
            // Only update if user is NOT currently dragging the slider
            if (!isSliding) {
                // expo-audio properties might vary by version, check docs if 'currentTime' is missing
                setPosition(player.currentTime);
                setDuration(player.duration || 1);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [player, isPlaying, isSliding]);

    // Format time (mm:ss)
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (!current || shouldHide) return null;

    return (
        <View
            style={styles.container}
            className='bg-darkWhite dark:bg-darkGray border border-accent-light dark:border-accent-dark rounded-2xl pb-2'>
            {/* Progress Bar (at the very top edge) */}
            <Slider
                style={styles.progressBar}
                minimumValue={0}
                maximumValue={duration}
                value={position}
                minimumTrackTintColor='#2B7FFF' // Blue
                maximumTrackTintColor='#555'
                thumbTintColor='transparent'
                onSlidingStart={() => setIsSliding(true)}
                onSlidingComplete={async (val) => {
                    if (player) await player.seekTo(val);
                    setPosition(val);
                    setIsSliding(false);
                }}
            />

            <View
                className='flex-row items-center px-3 -mt-1.5' /* marginTop: -5px */
            >
                {/* Song Info */}
                <View className='flex-1 justify-center'>
                    <Text
                        className='text-black dark:text-white font-bold'
                        style={{ fontSize: fontSize.lg }}
                        numberOfLines={1}>
                        {current.title}
                    </Text>
                    <Text
                        className='text-silverText mt-0.5'
                        style={{ fontSize: fontSize.sm }}>
                        {formatTime(position)} / {formatTime(duration)}
                    </Text>
                </View>
                {/* Controls */}
                <View className='flex-row items-center gap-1.5'>
                    <Pressable
                        onPress={isPlaying ? pause : resume}
                        className='p-1.5'>
                        {isPlaying ? (
                            <Pause
                                size={24}
                                color={
                                    colorScheme === "dark" ? "#fff" : "#0A0A0A"
                                }
                                fill={
                                    colorScheme === "dark" ? "#fff" : "#0A0A0A"
                                }
                            />
                        ) : (
                            <Play
                                size={24}
                                color={
                                    colorScheme === "dark" ? "#fff" : "#0A0A0A"
                                }
                                fill={
                                    colorScheme === "dark" ? "#fff" : "#0A0A0A"
                                }
                            />
                        )}
                    </Pressable>

                    {/* Close Button */}
                    <Pressable onPress={clearCurrent} className='p-1.5'>
                        <X
                            size={28}
                            color={colorScheme === "dark" ? "#bbb" : "#666"}
                        />
                    </Pressable>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 90, // Adjust this based on your TabBar height (usually 50-90)
        left: 10,
        right: 10,
        // backgroundColor: "#222", // Dark background
        // borderRadius: 12,
        // paddingBottom: 10,
        paddingTop: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
        overflow: "hidden", // Ensures the slider doesn't poke out
        borderWidth: 1,
        // borderColor: "#333",
    },
    progressBar: {
        width: "110%", // Slight overflow to hide the rounded edges of the slider track
        height: 25,
        marginLeft: -10, // Alignment hack
        marginTop: -11, // Push it to the very top edge
    },
});

export default MiniPlayer;
