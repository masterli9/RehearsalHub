import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
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

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            const msPerBeat = 60000 / bpm;
            interval = setInterval(() => {
                setTick(t => !t);
                // Poznámka: Zde by mohlo být přehraní krátkého "click" zvuku pomocí expo-av.
                // Jelikož žádný zvuk v assets není, metronom funguje primárně vizuálně a jako pamatovák pro uložení BPM.
            }, msPerBeat);
        }
        return () => {
            clearInterval(interval);
            setTick(false);
        };
    }, [isPlaying, bpm]);

    const handleIncrement = () => setBpm(Math.min(300, bpm + 1));
    const handleDecrement = () => setBpm(Math.max(30, bpm - 1));
    const handleIncrement10 = () => setBpm(Math.min(300, bpm + 10));
    const handleDecrement10 = () => setBpm(Math.max(30, bpm - 10));

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
                    onLongPress={handleDecrement10}
                    delayLongPress={300}
                    className="p-2 rounded-full active:bg-gray-200 dark:active:bg-[#333]">
                    <Minus size={20} color={colorScheme === 'dark' ? '#ababab' : '#A1A1A1'} />
                </Pressable>
                <Pressable 
                    onPress={handleIncrement} 
                    onLongPress={handleIncrement10}
                    delayLongPress={300}
                    className="p-2 rounded-full active:bg-gray-200 dark:active:bg-[#333]">
                    <Plus size={20} color={colorScheme === 'dark' ? '#ababab' : '#A1A1A1'} />
                </Pressable>
            </View>
        </View>
    );
};
