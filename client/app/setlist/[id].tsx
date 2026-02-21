import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
  useColorScheme,
  Modal,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StyledButton from "@/components/StyledButton";
import StyledTextInput from "@/components/StyledTextInput";
import { useBand } from "@/context/BandContext";
import { useAuth } from "@/context/AuthContext";
import apiUrl from "@/config";
import {
  ArrowLeft,
  Save,
  Plus,
  GripVertical,
  Trash2,
  X,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface SetlistSong {
  id?: number;
  song_id: number;
  order_index: number;
  title: string;
  key?: string;
  bpm?: number;
  length?: any;
  tags?: any[];
}

const formatLength = (length: any) => {
  if (!length) return null;
  if (typeof length === "object") {
    return `${length.minutes || 0}:${(length.seconds || 0).toString().padStart(2, "0")}`;
  }
  return String(length);
};

const getLengthInSeconds = (length: any) => {
  if (!length) return 0;
  if (typeof length === "object") {
    return (
      (parseInt(length.minutes) || 0) * 60 + (parseInt(length.seconds) || 0)
    );
  }
  if (typeof length === "string" && length.includes(":")) {
    const [m, s] = length.split(":");
    return (parseInt(m) || 0) * 60 + (parseInt(s) || 0);
  }
  return parseInt(length) || 0;
};

const formatTotalSeconds = (totalSeconds: number) => {
  if (totalSeconds === 0) return "0:00";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function SetlistEditor() {
  const { id, bandId } = useLocalSearchParams();
  const isNew = id === "new";
  const router = useRouter();
  const { user } = useAuth();
  const { activeBand } = useBand();
  const colorScheme = useColorScheme();
  const fontSize = useAccessibleFontSize();

  const [title, setTitle] = useState("");
  const [songs, setSongs] = useState<SetlistSong[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state
  const [isAddSongModalVisible, setIsAddSongModalVisible] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<any[]>([]);
  const [isLoadingAvailableSongs, setIsLoadingAvailableSongs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [readyStatusSelected, setReadyStatusSelected] = useState(false);
  const [draftStatusSelected, setDraftStatusSelected] = useState(false);
  const [finishedStatusSelected, setFinishedStatusSelected] = useState(false);

  // Filtering states
  const [tags, setTags] = useState<any[]>([]);
  const [selectedFilterTags, setSelectedFilterTags] = useState<number[]>([]);
  const [selectedFilterKeys, setSelectedFilterKeys] = useState<string[]>([]);

  const itemsKey = [
    { label: "C", value: "C" },
    { label: "C#", value: "C#" },
    { label: "D", value: "D" },
    { label: "D#", value: "D#" },
    { label: "E", value: "E" },
    { label: "F", value: "F" },
    { label: "F#", value: "F#" },
    { label: "G", value: "G" },
    { label: "G#", value: "G#" },
    { label: "A", value: "A" },
    { label: "A#", value: "A#" },
    { label: "B", value: "B" },
    { label: "Cm", value: "Cm" },
    { label: "C#m", value: "C#m" },
    { label: "Dm", value: "Dm" },
    { label: "D#m", value: "D#m" },
    { label: "Em", value: "Em" },
    { label: "Fm", value: "Fm" },
    { label: "F#m", value: "F#m" },
    { label: "Gm", value: "Gm" },
    { label: "G#m", value: "G#m" },
    { label: "Am", value: "Am" },
    { label: "A#m", value: "A#m" },
    { label: "Bm", value: "Bm" },
  ];

  useEffect(() => {
    if (!isNew && id) {
      fetchSetlistDetails();
    }
  }, [id, isNew]);

  const fetchSetlistDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/setlists/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTitle(data.title);
        setSongs(data.songs || []);
      } else {
        Alert.alert("Error", "Failed to load setlist details.");
      }
    } catch (error) {
      console.error("Error fetching setlist:", error);
      Alert.alert("Error", "Failed to load setlist details.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const currentBandId = bandId || activeBand?.id;
      if (!currentBandId) return;
      const res = await fetch(
        `${apiUrl}/api/songs/tags?bandId=${currentBandId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const fetchAvailableSongs = async () => {
    setIsLoadingAvailableSongs(true);
    try {
      const response = await fetch(
        `${apiUrl}/api/songs?bandId=${bandId || activeBand?.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setAvailableSongs(data);
      }
      await fetchTags();
    } catch (error) {
      console.error("Error fetching available songs:", error);
    } finally {
      setIsLoadingAvailableSongs(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a setlist title.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        bandId: bandId || activeBand?.id, // Use passed bandId or fallback to activeBand
        songs: songs.map((s, index) => ({
          song_id: s.song_id,
          order_index: index,
        })),
      };

      const url = isNew
        ? `${apiUrl}/api/setlists`
        : `${apiUrl}/api/setlists/${id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert(
          "Success",
          `Setlist ${isNew ? "created" : "updated"} successfully.`,
        );
        router.back();
      } else {
        Alert.alert("Error", "Failed to save setlist.");
      }
    } catch (error) {
      console.error("Error saving setlist:", error);
      Alert.alert("Error", "Failed to save setlist.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSetlist = () => {
    Alert.alert(
      "Delete Setlist",
      `Are you sure you want to delete "${title || "Untitled Setlist"}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            try {
              const response = await fetch(`${apiUrl}/api/setlists/${id}`, {
                method: "DELETE",
              });

              if (response.ok) {
                Alert.alert("Success", "Setlist deleted successfully.");
                router.back();
              } else {
                Alert.alert("Error", "Failed to delete setlist.");
              }
            } catch (error) {
              console.error("Error deleting setlist:", error);
              Alert.alert("Error", "Failed to delete setlist.");
            } finally {
              setIsSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleRemoveSong = (songIdToRemove: number) => {
    setSongs((prevSongs) =>
      prevSongs.filter((s) => s.song_id !== songIdToRemove),
    );
  };

  const handleAddSong = (song: any) => {
    setSongs((prev) => [
      ...prev,
      {
        song_id: song.song_id,
        title: song.title,
        key: song.key,
        bpm: song.bpm,
        length: song.length,
        order_index: prev.length,
      },
    ]);
    setIsAddSongModalVisible(false);
  };

  const renderSongItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<SetlistSong>) => {
    return (
      <ScaleDecorator activeScale={1.02}>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          className={`flex-row items-center justify-between p-4 mb-2 rounded-xl border ${isActive ? "bg-boxBackground-light dark:bg-boxBackground-dark opacity-80 border-blue" : "bg-boxBackground-light dark:bg-boxBackground-dark border-accent-light dark:border-accent-dark"}`}
        >
          <View className="flex-row items-center flex-1">
            <Pressable onPressIn={drag} className="mr-3 p-1">
              <GripVertical
                size={20}
                color={colorScheme === "dark" ? "#A1A1A1" : "#666"}
              />
            </Pressable>
            <View className="flex-col">
              <Text className="text-black dark:text-white font-semibold text-base">
                {item.title}
              </Text>
              {(item.key || item.bpm || item.length) && (
                <Text className="text-silverText text-sm mt-1">
                  {item.key ? `Key: ${item.key} ` : ""}
                  {item.bpm ? `| BPM: ${item.bpm} ` : ""}
                  {item.length ? `| ${formatLength(item.length)}` : ""}
                </Text>
              )}
            </View>
          </View>
          <Pressable
            onPress={() => handleRemoveSong(item.song_id)}
            className="p-2"
          >
            <Trash2 size={20} color="#FF453A" />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  };

  const filteredAvailableSongs = availableSongs.filter((song) => {
    // 1. Search Query
    const matchesSearch = song.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // 2. Not already in setlist
    const notInSetlist = !songs.some((s) => s.song_id === song.song_id);

    // 3. Status filter
    const activeStatuses = [
      readyStatusSelected ? "rehearsed" : null,
      finishedStatusSelected ? "finished" : null,
      draftStatusSelected ? "draft" : null,
    ].filter(Boolean);

    const matchesStatus =
      activeStatuses.length === 0 || activeStatuses.includes(song.status);

    // 4. Tag filter
    const matchesTags =
      selectedFilterTags.length === 0 ||
      (song.songTags &&
        song.songTags.some((tagItem: any) =>
          selectedFilterTags.includes(tagItem.tag.tag_id),
        ));

    // 5. Key filter
    const matchesKey =
      selectedFilterKeys.length === 0 || selectedFilterKeys.includes(song.key);

    return (
      matchesSearch &&
      notInSetlist &&
      matchesStatus &&
      matchesTags &&
      matchesKey
    );
  });

  if (isLoading) {
    return (
      <PageContainer>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2B7FFF" />
        </View>
      </PageContainer>
    );
  }

  const totalLengthSeconds = songs.reduce(
    (sum, song) => sum + getLengthInSeconds(song.length),
    0,
  );
  const formattedTotalLength = formatTotalSeconds(totalLengthSeconds);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PageContainer>
        <View className="flex-row items-center justify-between w-full border-b border-accent-light dark:border-accent-dark px-5 py-4">
          <View className="flex-row items-center flex-1">
            <Pressable onPress={() => router.back()} className="mr-3 p-2 -ml-2">
              <ArrowLeft
                size={24}
                color={colorScheme === "dark" ? "#fff" : "#000"}
              />
            </Pressable>
            <View className="flex-1 pr-2">
              <StyledTextInput
                placeholder="Setlist Title"
                value={title}
                onChangeText={setTitle}
                variant="rounded"
              />
            </View>
          </View>
        </View>

        <View className="flex-1 pt-3">
          <View className="w-full px-5">
            <View className="w-full flex-row gap-3">
              <StyledButton
                title="Add Song"
                className="flex-1"
                variant="accent"
                onPress={() => {
                  if (availableSongs.length === 0) fetchAvailableSongs();
                  setIsAddSongModalVisible(true);
                }}
              />
              <StyledButton
                title={isSaving ? "Saving..." : "Save Setlist"}
                className="flex-1"
                onPress={handleSave}
                disabled={isSaving}
              />
            </View>

            <View className="w-full mt-4">
              {!isNew && (
                <View className="flex-row justify-center mt-2 mb-2">
                  <Pressable onPress={handleDeleteSetlist} className="p-3">
                    <Text
                      className="text-red-500 font-bold"
                      style={{ fontSize: fontSize.base }}
                    >
                      Delete Setlist
                    </Text>
                  </Pressable>
                </View>
              )}

              <View className="w-full flex-row items-center justify-between mt-2 mb-4">
                <Text className="text-silverText font-medium flex-1 text-left">
                  {songs.length} Songs
                </Text>
                <Text className="text-silverText font-medium flex-1 text-right">
                  Total Length: {formattedTotalLength}
                </Text>
              </View>
            </View>
          </View>

          <DraggableFlatList
            data={songs}
            onDragEnd={({ data }: { data: SetlistSong[] }) => setSongs(data)}
            keyExtractor={(item: SetlistSong) => item.song_id.toString()}
            renderItem={renderSongItem}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Text className="text-silverText">
                  No songs added to this setlist yet.
                </Text>
              </View>
            }
          />
        </View>

        {/* Add Song Modal */}
        <Modal
          visible={isAddSongModalVisible}
          animationType="slide"
          transparent
        >
          <Pressable
            onPress={() => setIsAddSongModalVisible(false)}
            className="absolute top-0 bottom-0 left-0 right-0 bg-black/50"
          />
          <View className="flex-1 justify-end" pointerEvents="box-none">
            <View
              className="w-full h-[85%] bg-white dark:bg-boxBackground-dark rounded-t-3xl pt-2 pb-8 px-5 shadow-lg"
              pointerEvents="auto"
            >
              <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-4" />
              <View className="w-full flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-black dark:text-white">
                  Add Song
                </Text>
                <Pressable
                  onPress={() => setIsAddSongModalVisible(false)}
                  className="p-2"
                >
                  <X
                    size={24}
                    color={colorScheme === "dark" ? "#fff" : "#000"}
                  />
                </Pressable>
              </View>

              <View className="w-full flex-row items-center gap-2 mb-4">
                <View className="flex-1">
                  <StyledTextInput
                    placeholder="Search songs..."
                    variant="rounded"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <Pressable
                  onPress={() => setFiltersVisible(!filtersVisible)}
                  className={`p-3 rounded-2xl h-[48px] items-center justify-center flex-row border ${filtersVisible ? "bg-blue border-blue" : "bg-transparent border-gray-200 dark:border-accent-dark"}`}
                >
                  <SlidersHorizontal
                    size={20}
                    color={
                      filtersVisible
                        ? "#fff"
                        : colorScheme === "dark"
                          ? "#fff"
                          : "#000"
                    }
                  />
                </Pressable>
              </View>

              {/* Filters Inline Display (Optional, could just use the modal) */}
              {filtersVisible && (
                <View className="w-full mb-4 bg-gray-50 dark:bg-boxBackground-dark border border-gray-200 dark:border-accent-dark p-3 rounded-xl">
                  <View className="flex-row items-center gap-2 flex-wrap mt-3">
                    <Text className="text-black dark:text-white font-medium w-full mb-1">
                      Status
                    </Text>
                    <Pressable
                      onPress={() =>
                        setReadyStatusSelected(!readyStatusSelected)
                      }
                      className={`px-3 py-1.5 rounded-lg border ${readyStatusSelected ? "bg-transparentGreen border-green" : "bg-transparent border-gray-400"}`}
                    >
                      <Text className="text-black dark:text-white">
                        rehearsed
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setFinishedStatusSelected(!finishedStatusSelected)
                      }
                      className={`px-3 py-1.5 rounded-lg border ${finishedStatusSelected ? "bg-transparentGreen border-green" : "bg-transparent border-gray-400"}`}
                    >
                      <Text className="text-black dark:text-white">
                        finished
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setDraftStatusSelected(!draftStatusSelected)
                      }
                      className={`px-3 py-1.5 rounded-lg border ${draftStatusSelected ? "bg-transparentGreen border-green" : "bg-transparent border-gray-400"}`}
                    >
                      <Text className="text-black dark:text-white">draft</Text>
                    </Pressable>
                  </View>

                  <View className="flex-row items-center gap-2 flex-wrap mt-4">
                    <Text className="text-black dark:text-white font-medium w-full mb-1">
                      Key
                    </Text>
                    {itemsKey.map((keyItem) => {
                      const isSelected = selectedFilterKeys.includes(
                        keyItem.value,
                      );
                      return (
                        <Pressable
                          key={keyItem.value}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedFilterKeys(
                                selectedFilterKeys.filter(
                                  (k) => k !== keyItem.value,
                                ),
                              );
                            } else {
                              setSelectedFilterKeys([
                                ...selectedFilterKeys,
                                keyItem.value,
                              ]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg border ${isSelected ? "bg-transparentGreen border-green" : "bg-transparent border-gray-400"}`}
                        >
                          <Text className="text-black dark:text-white">
                            {keyItem.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {tags.length > 0 && (
                    <View className="flex-row items-center gap-2 flex-wrap mt-4">
                      <Text className="text-black dark:text-white font-medium w-full mb-1">
                        Tags
                      </Text>
                      {tags.map((tag: any) => {
                        const isSelected = selectedFilterTags.includes(
                          tag.tag_id,
                        );
                        return (
                          <Pressable
                            key={tag.tag_id}
                            onPress={() => {
                              if (isSelected) {
                                setSelectedFilterTags(
                                  selectedFilterTags.filter(
                                    (id) => id !== tag.tag_id,
                                  ),
                                );
                              } else {
                                setSelectedFilterTags([
                                  ...selectedFilterTags,
                                  tag.tag_id,
                                ]);
                              }
                            }}
                            className="rounded-lg px-3 py-1.5 mb-1"
                            style={{
                              backgroundColor: tag.color,
                              borderWidth: isSelected ? 2 : 0,
                              borderColor:
                                colorScheme === "dark" ? "#fff" : "#000",
                              opacity: isSelected ? 1 : 0.7,
                            }}
                          >
                            <Text className="text-white font-semibold">
                              {tag.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {isLoadingAvailableSongs ? (
                <ActivityIndicator size="large" className="mt-10" />
              ) : (
                <DraggableFlatList
                  data={filteredAvailableSongs}
                  onDragEnd={({ data }: { data: any[] }) => {}} // dummy
                  keyExtractor={(item: any) => item.song_id.toString()}
                  renderItem={({ item }: { item: any }) => (
                    // Use FlatList inside Modal to prevent any draggable side effects
                    <Pressable
                      onPress={() => handleAddSong(item)}
                      className="flex-row items-center justify-between p-4 mb-2 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-accent-dark"
                    >
                      <View className="flex-col">
                        <Text className="text-black dark:text-white font-semibold">
                          {item.title}
                        </Text>
                        {(item.key || item.bpm) && (
                          <Text className="text-silverText text-sm">
                            {item.key ? `Key: ${item.key} ` : ""}
                            {item.bpm ? `| ${item.bpm} BPM` : ""}
                          </Text>
                        )}
                      </View>
                      <Plus size={20} color="#2B7FFF" />
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text className="text-center text-silverText mt-10">
                      No matching songs found.
                    </Text>
                  }
                />
              )}
            </View>
          </View>
        </Modal>
      </PageContainer>
    </GestureHandlerRootView>
  );
}
