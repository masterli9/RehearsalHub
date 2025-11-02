import { Modal, Pressable, View, Text } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

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
                        <Text className='text-3xl font-bold text-black dark:text-white my-2'>
                            {title}
                        </Text>
                        {subtitle && (
                            <Text className='text-base font-regular text-silverText text-center mb-2'>
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

