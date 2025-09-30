import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import { Pressable, Text } from "react-native";

export default function GoogleSignInButton() {
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId:
            "1092570739344-radkahd9us79iiv8enc3im7ucudjtu3s.apps.googleusercontent.com",
    });

    useEffect(() => {
        if (response?.type === "success") {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential);
        }
    }, [response]);

    return (
        <Pressable disabled={!request} onPress={() => promptAsync()}>
            <Text>Sign in with Google</Text>
        </Pressable>
    );
}
