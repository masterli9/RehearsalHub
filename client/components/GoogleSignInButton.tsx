import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import { Image, Pressable, Text } from "react-native";

export default function GoogleSignInButton({
    className,
}: {
    className: string;
}) {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId:
            "1092570739344-radkahd9us79iiv8enc3im7ucudjtu3s.apps.googleusercontent.com",
        redirectUri: "https://auth.expo.dev/@sterli/rehearsalhub",
    });

    useEffect(() => {
        if (response?.type === "success") {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential);
        }
    }, [response]);

    return (
        <Pressable
            disabled={!request}
            onPress={() => promptAsync()}
            className={className}
        >
            <Image
                source={{
                    uri: "https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw",
                }}
                className="w-10 h-full"
                resizeMode="contain"
            />
            <Text className="text-white text-xl">Sign in with Google</Text>
        </Pressable>
    );
}
