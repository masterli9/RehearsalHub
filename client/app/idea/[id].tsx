import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StyledButton from "@/components/StyledButton";
import StyledTextInput from "@/components/StyledTextInput";
import Card from "@/components/Card";
import apiUrl from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { usePlayer } from "@/context/AudioPlayerContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ActivityIndicator, Alert, Pressable, Text, View, TextInput } from "react-native";
import { Play, Pause, Save, Music4, Clock, Hash, ArrowLeft } from "lucide-react-native";

export default function IdeaDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { activeBand } = useBand();
    const { user } = useAuth();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();
    const { play, pause, current, isPlaying } = usePlayer();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalIdea, setOriginalIdea] = useState<any>(null);

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [songKey, setSongKey] = useState("");
    const [bpm, setBpm] = useState("");
    const [timeSignature, setTimeSignature] = useState("");
    const [tabText, setTabText] = useState("");

    const isCurrent = current?.song_id === Number(id) && current?.type === "idea";

    const fetchIdea = useCallback(async () => {
        if (!activeBand?.id) return;
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/ideas/get?band_id=${activeBand.id}`);
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                const idea = data.find((i: any) => i.idea_id === Number(id));
                if (idea) {
                    setOriginalIdea(idea);
                    setTitle(idea.title || "");
                    setDescription(idea.description || "");
                    setSongKey(idea.key || "");
                    setBpm(idea.bpm ? String(idea.bpm) : "");
                    setTimeSignature(idea.time_signature || "");
                    setTabText(idea.text_tabs || "");
                } else {
                    Alert.alert("Error", "Idea not found");
                    router.back();
                }
            }
        } catch (err) {
            console.error("Error fetching idea:", err);
        } finally {
            setLoading(false);
        }
    }, [activeBand?.id, id, router]);

    useEffect(() => {
        fetchIdea();
    }, [fetchIdea]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${apiUrl}/api/ideas/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    key: songKey,
                    bpm: bpm ? parseInt(bpm, 10) : null,
                    time_signature: timeSignature,
                    text_tabs: tabText,
                }),
            });
            
            if (!response.ok) {
                throw new Error("Failed to save properties");
            }
            
            Alert.alert("Saved", "Idea updated successfully");
            router.back();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save idea properties.");
        } finally {
            setSaving(false);
        }
    };

    const handlePlay = () => {
        if (!originalIdea?.audiourl) return;
        if (isCurrent && isPlaying) {
            pause();
        } else {
            play({
                song_id: originalIdea.idea_id,
                title: originalIdea.title,
                url: originalIdea.audiourl,
                type: "idea",
            });
        }
    };

    const insertGuitarTab = () => {
        const guitarTpl = `\ne|-------------------\nB|-------------------\nG|-------------------\nD|-------------------\nA|-------------------\nE|-------------------\n`;
        setTabText((prev) => prev + guitarTpl);
    };

    const insertBassTab = () => {
        const bassTpl = `\nG|-------------------\nD|-------------------\nA|-------------------\nE|-------------------\n`;
        setTabText((prev) => prev + bassTpl);
    };

    if (loading) {
        return (
            <PageContainer>
                <View className='flex-1 justify-center items-center'>
                    <ActivityIndicator size="large" color="#2B7FFF" />
                </View>
            </PageContainer>
        );
    }

    if (!originalIdea) return null;

    return (
        <PageContainer>
            <View className="flex-row items-center p-4 border-b border-accent-light dark:border-accent-dark w-full bg-lightBg dark:bg-darkBg">
                <Pressable onPress={() => router.back()} className="mr-4">
                    <ArrowLeft color={colorScheme === 'dark' ? '#fff' : '#000'} size={24} />
                </Pressable>
                <Text className="text-black dark:text-white font-bold flex-1" style={{ fontSize: fontSize['2xl'] }}>
                    Edit Idea
                </Text>
            </View>

            <KeyboardAwareScrollView 
                className="flex-1 w-full px-4 bg-lightBg dark:bg-black" 
                contentContainerStyle={{ paddingVertical: 20 }}
                enableOnAndroid={true}
                extraScrollHeight={100}
            >
                <Card className="w-full mb-6">
                    <Text className="text-silverText font-semibold mb-2" style={{ fontSize: fontSize.sm }}>Title</Text>
                    <StyledTextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Idea Title"
                    />

                    {originalIdea.idea_type !== 'text' && (
                        <View className="flex-row justify-center items-center mt-6 p-4 bg-lightBg dark:bg-[#222] rounded-xl border border-accent-light dark:border-accent-dark">
                            <Pressable onPress={handlePlay} disabled={!originalIdea.audiourl} className="p-4 bg-black dark:bg-white rounded-full">
                                {isCurrent && isPlaying ? (
                                    <Pause color={colorScheme === "dark" ? "#000" : "#fff"} size={28} />
                                ) : (
                                    <Play color={colorScheme === "dark" ? "#000" : "#fff"} size={28} style={{ opacity: originalIdea.audiourl ? 1 : 0.5 }} />
                                )}
                            </Pressable>
                            <Text className="text-black dark:text-white font-bold ml-4" style={{ fontSize: fontSize.lg }}>Audio Recording</Text>
                        </View>
                    )}
                </Card>

                <Card className="w-full mb-6 flex-col">
                    <Text className="text-silverText font-semibold mb-4" style={{ fontSize: fontSize.sm }}>Metadata</Text>
                    
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                                <Music4 size={14} color="#A1A1A1" />
                                <Text className="text-silverText" style={{ fontSize: fontSize.xs }}>Key</Text>
                            </View>
                            <StyledTextInput value={songKey} onChangeText={setSongKey} placeholder="e.g. Am" />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                                <Clock size={14} color="#A1A1A1" />
                                <Text className="text-silverText" style={{ fontSize: fontSize.xs }}>BPM</Text>
                            </View>
                            <StyledTextInput value={bpm} onChangeText={setBpm} placeholder="120" keyboardType="numeric" />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                                <Hash size={14} color="#A1A1A1" />
                                <Text className="text-silverText" style={{ fontSize: fontSize.xs }}>Time</Text>
                            </View>
                            <StyledTextInput value={timeSignature} onChangeText={setTimeSignature} placeholder="4/4" />
                        </View>
                    </View>
                    
                    <Text className="text-silverText text-xs mb-1">Description / Lyrics</Text>
                    <StyledTextInput 
                        value={description} 
                        onChangeText={setDescription} 
                        placeholder="Additional notes or lyrics..."
                        multiline
                        numberOfLines={4}
                        style={{ height: 100, textAlignVertical: 'top' }}
                    />
                </Card>

                <Card className="w-full mb-6 border-2 border-darkRed">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-silverText font-semibold" style={{ fontSize: fontSize.sm }}>Tabs / Notes</Text>
                        <View className="flex-row gap-2">
                            <Pressable onPress={insertBassTab} className="bg-[#333] px-3 py-1 rounded-md">
                                <Text className="text-white text-xs">+ Bass</Text>
                            </Pressable>
                            <Pressable onPress={insertGuitarTab} className="bg-[#333] px-3 py-1 rounded-md">
                                <Text className="text-white text-xs">+ Guitar</Text>
                            </Pressable>
                        </View>
                    </View>
                    
                    <TextInput
                        className={`w-full bg-[#f6f6f6] dark:bg-[#1a1a1a] rounded-lg p-3 text-black dark:text-white border border-accent-light dark:border-accent-dark`}
                        style={{
                            fontFamily: 'monospace',
                            minHeight: 200,
                            textAlignVertical: 'top',
                            fontSize: fontSize.base,
                        }}
                        multiline
                        placeholder="Write your tabs or riffs here..."
                        placeholderTextColor="#A1A1A1"
                        value={tabText}
                        onChangeText={setTabText}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </Card>

                <StyledButton 
                    title={saving ? "Saving..." : "Save Changes"} 
                    onPress={handleSave} 
                    disabled={saving}
                    className="mb-10"
                />
            </KeyboardAwareScrollView>
        </PageContainer>
    );
}
