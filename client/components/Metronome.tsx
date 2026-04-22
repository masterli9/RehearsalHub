import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccessibleFontSize } from '@/hooks/use-accessible-font-size';
import { Minus, Plus, Play, Square } from 'lucide-react-native';

interface MetronomeProps {
    bpm: number;
    setBpm: (bpm: number) => void;
    isPlaying: boolean;
    setIsPlaying: (isPlaying: boolean) => void;
}

export const Metronome = ({ bpm, setBpm, isPlaying, setIsPlaying }: MetronomeProps) => {
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();
    const [tick, setTick] = useState(false);

    const clickPlayer = useAudioPlayer(require('@/assets/click.wav'));

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            const msPerBeat = 60000 / bpm;
            interval = setInterval(() => {
                setTick(t => !t);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                clickPlayer.seekTo(0);
                clickPlayer.play();
            }, msPerBeat);
        }
        return () => {
            clearInterval(interval);
            setTick(false);
        };
    }, [isPlaying, bpm]);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleIncrement = () => setBpm(prev => Math.min(300, prev + 1));
    const handleDecrement = () => setBpm(prev => Math.max(30, prev - 1));

    const startIncrementing = () => {
        handleIncrement();
        intervalRef.current = setInterval(() => handleIncrement(), 100);
    };
    const startDecrementing = () => {
        handleDecrement();
        intervalRef.current = setInterval(() => handleDecrement(), 100);
    };
    const stopChanging = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

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
                    onPressIn={startDecrementing}
                    onPressOut={stopChanging}
                    className="p-2 rounded-full active:bg-gray-200 dark:active:bg-[#333]">
                    <Minus size={20} color={colorScheme === 'dark' ? '#ababab' : '#A1A1A1'} />
                </Pressable>
                <Pressable 
                    onPressIn={startIncrementing}
                    onPressOut={stopChanging}
                    className="p-2 rounded-full active:bg-gray-200 dark:active:bg-[#333]">
                    <Plus size={20} color={colorScheme === 'dark' ? '#ababab' : '#A1A1A1'} />
                </Pressable>
            </View>
        </View>
    );
};
