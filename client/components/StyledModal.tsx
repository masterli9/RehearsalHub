import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { Modal, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MenuProvider } from "react-native-popup-menu";

interface StyledModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    canClose?: boolean;
    wide?: boolean;
    headerLeft?: React.ReactNode;
    headerRight?: React.ReactNode;
}

const StyledModal: React.FC<StyledModalProps> = ({
    visible,
    onClose,
    title,
    subtitle,
    children,
    canClose = true,
    wide = false,
    headerLeft,
    headerRight,
}) => {
    const fontSize = useAccessibleFontSize();
    return (
        <Modal
            visible={visible}
            animationType='fade'
            transparent
            onRequestClose={canClose ? onClose : () => {}}>
            <MenuProvider skipInstanceCheck>
                <Pressable
                    onPress={canClose ? onClose : () => {}}
                className='absolute top-0 left-0 right-0 bottom-0 flex-1 justify-center items-center bg-black/70 z-0'>
                <KeyboardAwareScrollView
                    keyboardShouldPersistTaps='handled'
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                    <Pressable
                        onPress={() => {}}
                        className={`bg-darkWhite dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark p-5 flex-col justify-center ${wide ? "w-96" : "w-80"} items-center rounded-2xl relative`}>
                        {headerLeft && (
                            <View className="absolute top-6 left-5 z-50">
                                {headerLeft}
                            </View>
                        )}
                        {headerRight && (
                            <View className="absolute top-6 right-5 z-50">
                                {headerRight}
                            </View>
                        )}
                        <Text
                            className='font-bold text-black dark:text-white my-2 px-6 text-center'
                            style={{ fontSize: fontSize["3xl"] }}>
                            {title}
                        </Text>
                        {subtitle && (
                            <Text
                                className='font-regular text-silverText text-center mb-2'
                                style={{ fontSize: fontSize.base }}>
                                {subtitle}
                            </Text>
                        )}
                        {children}
                    </Pressable>
                </KeyboardAwareScrollView>
            </Pressable>
            </MenuProvider>
        </Modal>
    );
};

export default StyledModal;
