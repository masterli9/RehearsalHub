import { Modal, Pressable, View, Text } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";

interface StyledModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

const StyledModal: React.FC<StyledModalProps> = ({
    visible,
    onClose,
    title,
    subtitle,
    children,
}) => {
    const fontSize = useAccessibleFontSize();
    return (
        <Modal
            visible={visible}
            animationType='fade'
            transparent
            onRequestClose={onClose}>
            <Pressable
                onPress={onClose}
                className='absolute top-0 left-0 right-0 bottom-0 flex-1 justify-center items-center bg-black/70'>
                <KeyboardAwareScrollView
                    keyboardShouldPersistTaps='handled'
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                    <Pressable
                        onPress={() => {}}
                        className='bg-darkWhite dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark p-5 flex-col justify-center items-center w-80 rounded-2xl'>
                        <Text className='font-bold text-black dark:text-white my-2' style={{ fontSize: fontSize['3xl'] }}>
                            {title}
                        </Text>
                        {subtitle && (
                            <Text className='font-regular text-silverText text-center mb-2' style={{ fontSize: fontSize.base }}>
                                {subtitle}
                            </Text>
                        )}
                        {children}
                    </Pressable>
                </KeyboardAwareScrollView>
            </Pressable>
        </Modal>
    );
};

export default StyledModal;

