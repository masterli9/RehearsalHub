import React from "react";
import { Modal, Pressable, View, Text } from "react-native";
import { Link } from "expo-router";
import { useMoreSheet } from "./MoreSheetContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { X, Calendar, CheckSquare, Target, User } from "lucide-react-native";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";

export default function MoreSheet() {
    const { visible, close } = useMoreSheet();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const fontSize = useAccessibleFontSize();

    return (
        <>
            {visible && (
                <View className='absolute top-0 left-0 right-0 bottom-0 bg-black/50 w-full flex-1 z-10'></View>
            )}
            <Modal
                visible={visible}
                transparent
                animationType='slide'
                onRequestClose={close}>
                <Pressable onPress={close} className='flex-1 justify-end'>
                    <Pressable
                        onPress={(e) => e.stopPropagation()}
                        className='bg-boxBackground-light dark:bg-boxBackground-dark border-t border-accent-light dark:border-accent-dark rounded-t-3xl p-6'>
                        {/* Header with close button */}
                        <View className='flex-row items-center justify-between mb-4'>
                            <Text className='font-semibold dark:text-white' style={{ fontSize: fontSize.xl }}>
                                More
                            </Text>
                            <Pressable
                                onPress={close}
                                className='p-2 rounded-full bg-accent-light dark:bg-accent-dark active:opacity-70'>
                                <X size={20} color={isDark ? "#fff" : "#000"} />
                            </Pressable>
                        </View>

                        <View className='gap-3'>
                            {/* Row 1 */}
                            <View className='flex-row gap-3'>
                                <Link
                                    href='/(tabs)/_events'
                                    asChild
                                    className='flex-1'>
                                    <Pressable
                                        onPress={close}
                                        className='flex-1 p-4 rounded-xl active:bg-accent-light dark:active:bg-accent-dark'>
                                        <View className='flex-row items-center gap-2'>
                                            <Calendar
                                                size={20}
                                                color={isDark ? "#fff" : "#000"}
                                            />
                                            <Text className='font-medium dark:text-white' style={{ fontSize: fontSize.base }}>
                                                Events
                                            </Text>
                                        </View>
                                    </Pressable>
                                </Link>

                                <Link
                                    href='/(tabs)/_practice'
                                    asChild
                                    className='flex-1'>
                                    <Pressable
                                        onPress={close}
                                        className='flex-1 p-4 rounded-xl active:bg-accent-light dark:active:bg-accent-dark'>
                                        <View className='flex-row items-center gap-2'>
                                            <Target
                                                size={20}
                                                color={isDark ? "#fff" : "#000"}
                                            />
                                            <Text className='font-medium dark:text-white' style={{ fontSize: fontSize.base }}>
                                                Practice
                                            </Text>
                                        </View>
                                    </Pressable>
                                </Link>
                            </View>

                            {/* Row 2 */}
                            <View className='flex-row gap-3'>
                                <Link
                                    href='/(tabs)/_todos'
                                    asChild
                                    className='flex-1'>
                                    <Pressable
                                        onPress={close}
                                        className='flex-1 p-4 rounded-xl active:bg-accent-light dark:active:bg-accent-dark'>
                                        <View className='flex-row items-center gap-2'>
                                            <CheckSquare
                                                size={20}
                                                color={isDark ? "#fff" : "#000"}
                                            />
                                            <Text className='font-medium dark:text-white' style={{ fontSize: fontSize.base }}>
                                                Todos
                                            </Text>
                                        </View>
                                    </Pressable>
                                </Link>

                                <Link
                                    href='/(tabs)/_profile'
                                    asChild
                                    className='flex-1'>
                                    <Pressable
                                        onPress={close}
                                        className='flex-1 p-4 rounded-xl active:bg-accent-light dark:active:bg-accent-dark'>
                                        <View className='flex-row items-center gap-2'>
                                            <User
                                                size={20}
                                                color={isDark ? "#fff" : "#000"}
                                            />
                                            <Text className='font-medium dark:text-white' style={{ fontSize: fontSize.base }}>
                                                Profile
                                            </Text>
                                        </View>
                                    </Pressable>
                                </Link>
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}
