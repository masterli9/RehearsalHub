import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Pressable, Text, Image } from "react-native";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import * as AuthSession from "expo-auth-session";
import { useAuth } from "@/context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInButton({
    className,
}: {
    className?: string;
}) {
    const { googleSignIn } = useAuth();
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId:
            "1092570739344-radkahd9us79iiv8enc3im7ucudjtu3s.apps.googleusercontent.com",
        androidClientId:
            "1092570739344-t2hps1ekhbs9um9ufhrofk8lr1slk8ra.apps.googleusercontent.com",
    });
    useEffect(() => {
        if (response?.type === "success") {
            const id_token = response.params.id_token;
            if (!id_token) {
                console.error("No id_token in response.params");
                return;
            }
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
                .then(() => {
                    console.log("Firebase login success");
                    // The AuthContext will handle user registration automatically
                })
                .catch((err) => console.error("Firebase login error:", err));
        }
    }, [response]);

    return (
        <Pressable
            disabled={!request}
            onPress={async () => {
                await promptAsync();
            }}
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
