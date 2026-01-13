import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ReactNode } from "react";
import { Text, View } from "react-native";
import {
    Menu,
    MenuOptions,
    MenuTrigger,
    renderers,
} from "react-native-popup-menu";

interface PageHeaderProps {
    title: string;
    subtitle: string;
    children?: ReactNode;
    useSlideInMenu?: boolean;
}

export default function PageHeader({
    title,
    subtitle,
    children,
    useSlideInMenu = false,
}: PageHeaderProps) {
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();
    const { SlideInMenu } = renderers;

    return (
        <View className='flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark mt-4 w-full px-5 py-2'>
            <View className='flex-col items-start justify-center'>
                <Text
                    className='text-black dark:text-white font-bold my-1'
                    style={{ fontSize: fontSize["2xl"] }}>
                    {title}
                </Text>
                <Text
                    className='text-silverText'
                    style={{ fontSize: fontSize.base }}>
                    {subtitle}
                </Text>
            </View>
            {children && (
                <View className='flex-row items-center justify-center'>
                    <Menu
                        renderer={useSlideInMenu ? SlideInMenu : undefined}
                        rendererProps={{ transitionDuration: 200 }}>
                        <MenuTrigger>
                            <Text
                                className='text-black dark:text-white p-4'
                                style={{ fontSize: fontSize["2xl"] }}>
                                ⋯
                            </Text>
                        </MenuTrigger>
                        <MenuOptions
                            customStyles={{
                                optionsContainer: {
                                    borderRadius: 10,
                                    backgroundColor:
                                        colorScheme === "dark"
                                            ? "#333"
                                            : "#fff",
                                },
                            }}>
                            {children}
                        </MenuOptions>
                    </Menu>
                </View>
            )}
        </View>
    );
}
