import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibleFontSize } from '@/hooks/use-accessible-font-size';
import { Minus, Plus, Play, Square } from 'lucide-react-native';

interface MetronomeProps {
    bpm: number;
    setBpm: React.Dispatch<React.SetStateAction<number>>;
    isPlaying: boolean;
    setIsPlaying: (isPlaying: boolean) => void;
}

export const Metronome = ({ bpm, setBpm, isPlaying, setIsPlaying }: MetronomeProps) => {
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();
    const [tick, setTick] = useState(false);

    // To improve the sound, replace the `@/assets/click.wav` file with a better quality
    // metronome tick sound (such as a rimshot, cowbell, or classic woodblock).
    const clickPlayer = useAudioPlayer(require('@/assets/click.wav'));
    
    // We use a ref for BPM so our audio tick interval always reads the latest value
    // without having to tear down and restart the effect on every BPM change.
    const bpmRef = useRef(bpm);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        bpmRef.current = bpm;
    }, [bpm]);

    useEffect(() => {
        if (!isPlaying) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setTick(false);
            return;
        }

        let expectedTime = Date.now();

        const playTick = () => {
            setTick(t => !t);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            clickPlayer.seekTo(0);
            clickPlayer.play();

            const currentBpm = bpmRef.current;
            const msPerBeat = 60000 / currentBpm;
            
            // Expected time of the *next* beat
            expectedTime += msPerBeat;
            const now = Date.now();
            let nextTime = expectedTime - now;

            // If the app was frozen/backgrounded and we fell behind, reset to avoid machine-gun effect
            if (nextTime < 0) {
                expectedTime = now;
                nextTime = msPerBeat;
            }

            timeoutRef.current = setTimeout(playTick, nextTime);
        };

        // Start first tick immediately
        playTick();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isPlaying, clickPlayer]);

    const handleIncrement = useCallback(() => setBpm((prev: number) => Math.min(300, prev + 1)), [setBpm]);
    const handleDecrement = useCallback(() => setBpm((prev: number) => Math.max(30, prev - 1)), [setBpm]);

    const stopChanging = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startIncrementing = useCallback(() => {
        stopChanging(); // Always clear before starting a new one to prevent orphaned intervals
        intervalRef.current = setInterval(() => {
            setBpm((prev: number) => Math.min(300, prev + 1));
        }, 50); // Faster increment loop when held down
    }, [setBpm, stopChanging]);

    const startDecrementing = useCallback(() => {
        stopChanging();
        intervalRef.current = setInterval(() => {
            setBpm((prev: number) => Math.max(30, prev - 1));
        }, 50);
    }, [setBpm, stopChanging]);

    // Safety clear of intervals on teardown
    useEffect(() => {
        return () => stopChanging();
    }, [stopChanging]);

    return (
        <View className="flex-row items-center justify-between w-full bg-card dark:bg-card-dark p-3 rounded-lg shadow-sm border border-accent-light dark:border-accent-dark">
            <View className="flex-row items-center gap-4">
                <Pressable 
                    onPress={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-black dark:bg-white rounded-full active:opacity-75">
                    {isPlaying ? (
                        <Square size={20} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                    ) : (
                        <Play size={20} color={colorScheme === 'dark' ? '#000' : '#fff'} />
                    )}
                </Pressable>
                
                <View className="flex-col pb-1">
                    <Text className="text-silverText uppercase tracking-wider" style={{ fontSize: fontSize.xs }}>Metronome</Text>
                    <View className="flex-row items-center gap-2">
                        <Text className="text-black dark:text-white font-bold" style={{ fontSize: fontSize['2xl'] }}>{bpm}</Text>
                        <Text className="text-silverText" style={{ fontSize: fontSize.sm }}>BPM</Text>
                    </View>
                </View>
            </View>

            <View className="flex-row items-center gap-2">
                {isPlaying && (
                    <View className={`w-3 h-3 rounded-full mr-2 ${tick ? 'bg-darkRed' : 'bg-silverText'}`} />
                )}
                <Pressable 
                    onPress={handleDecrement}
                    onLongPress={startDecrementing}
                    onPressOut={stopChanging}
                    delayLongPress={200}
                    className="p-2 rounded-full active:bg-gray-200 dark:active:bg-[#333]">
                    <Minus size={20} color={colorScheme === 'dark' ? '#ababab' : '#A1A1A1'} />
                </Pressable>
                <Pressable 
                    onPress={handleIncrement}
                    onLongPress={startIncrementing}
                    onPressOut={stopChanging}
                    delayLongPress={200}
                    className="p-2 rounded-full active:bg-gray-200 dark:active:bg-[#333]">
                    <Plus size={20} color={colorScheme === 'dark' ? '#ababab' : '#A1A1A1'} />
                </Pressable>
            </View>
        </View>
    );
};
