import ErrorText from "@/components/ErrorText";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StyledButton from "@/components/StyledButton";
import StyledDropdown from "@/components/StyledDropdown";
import StyledModal from "@/components/StyledModal";
import StyledTextInput from "@/components/StyledTextInput";
import SwitchTabs from "@/components/SwitchTabs";
import apiUrl from "@/config";
import { useAuth } from "@/context/AuthContext";
import { useBand } from "@/context/BandContext";
import { useAccessibleFontSize } from "@/hooks/use-accessible-font-size";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Formik } from "formik";
import { Calendar, CheckSquare, Square, Trash2, Edit2, User } from "lucide-react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import * as yup from "yup";

type Task = {
    task_id: number;
    title: string;
    description: string | null;
    due_date: string | null;
    band_member_id: number;
    assigned_by: number | null;
    status: 'pending' | 'completed';
    assignee_username: string;
    assignee_photo: string | null;
    assigner_username: string | null;
    assigner_photo: string | null;
};

const todos = () => {
    const { user } = useAuth();
    const { bands, activeBand, bandsLoading, fetchBandMembers } = useBand();
    const fontSize = useAccessibleFontSize();
    const colorScheme = useColorScheme();

    const [activeTab, setActiveTab] = useState<string>("My Todos");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [tasksLoadError, setTasksLoadError] = useState(false);
    const TIMEOUT_MS = 20 * 1000;

    // Add/Edit Modal States
    const [taskModalVisible, setTaskModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    // Date Picker States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    // Band Members and Roles State
    const [bandMembers, setBandMembers] = useState<any[]>([]);
    const [currentUserRoles, setCurrentUserRoles] = useState<string[]>([]);
    const [myBandMemberId, setMyBandMemberId] = useState<number | null>(null);

    // Dropdown assignees
    const [openAssignee, setOpenAssignee] = useState(false);
    const [valueAssignee, setValueAssignee] = useState<string | null>(null);
    const [itemsAssignee, setItemsAssignee] = useState<{ label: string, value: string }[]>([]);

    const fetchTasks = async () => {
        if (!activeBand?.id) {
            setTasks([]);
            return;
        }
        setLoadingTasks(true);
        setTasksLoadError(false);
        
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, TIMEOUT_MS);

        try {
            const res = await fetch(`${apiUrl}/api/tasks?bandId=${activeBand.id}`, {
                signal: abortController.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            setTasks(data);
        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error("Error fetching tasks:", error);
            if (error.name === "AbortError") {
                setTasksLoadError(true);
            } else {
                setTasksLoadError(true);
                setTasks([]);
            }
        } finally {
            setLoadingTasks(false);
        }
    };

    const loadBandMembers = async () => {
        if (!activeBand?.id) return;
        try {
            const data = await fetchBandMembers(activeBand.id) as any;
            setBandMembers(data.members || []);
            setCurrentUserRoles(data.currentUserRoles || []);

            // Find my bandMemberId
            const me = data.members?.find((m: any) => m.firebase_uid === user?.uid);
            if (me) {
                setMyBandMemberId(me.band_member_id);
            }

            // Populate dropdown items
            if (data.members) {
                setItemsAssignee(data.members.map((m: any) => ({
                    label: m.username,
                    value: m.band_member_id?.toString()
                })));
            }
        } catch (error) {
            console.error("Error loading band members", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (activeBand?.id) {
                loadBandMembers();
                fetchTasks();
            }
        }, [activeBand?.id])
    );

    const isLeader = currentUserRoles.includes("Leader");

    // Derived tasks to display
    const displayedTasks = tasks.filter((t) => {
        if (activeTab === "My Todos") {
            return t.band_member_id === myBandMemberId;
        }
        return true; // "Band Todos" sees all
    });

    const pendingTasks = displayedTasks.filter(t => t.status === "pending");
    const completedTasks = displayedTasks.filter(t => t.status === "completed");

    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === 'pending' ? 'completed' : 'pending';
        // Optimistic UI update
        setTasks(prev => prev.map(t => t.task_id === task.task_id ? { ...t, status: newStatus } : t));
        try {
            const res = await fetch(`${apiUrl}/api/tasks/${task.task_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                throw new Error("Failed to update task status");
            }
        } catch (error) {
            console.error(error);
            // Revert on error
            setTasks(prev => prev.map(t => t.task_id === task.task_id ? { ...t, status: task.status } : t));
            Alert.alert("Error", "Could not toggle task status");
        }
    };

    const handleDelete = async (taskId: number) => {
        Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const res = await fetch(`${apiUrl}/api/tasks/${taskId}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Failed to delete task");
                        fetchTasks();
                    } catch (error) {
                        console.error(error);
                        Alert.alert("Error", "Could not delete task");
                    }
                }
            }
        ]);
    };

    const taskSchema = yup.object().shape({
        title: yup.string().trim().min(2, "Title too short").max(255).required("Title is required"),
        description: yup.string().nullable().max(1000),
        assignee: yup.number().nullable() // Must handle manually because Formik/Yup with Dropdown can be tricky
    });

    const openCreateModal = () => {
        setEditingTask(null);
        setSelectedDate(null);
        setValueAssignee(myBandMemberId ? myBandMemberId.toString() : null); // Default assignee is self
        setTaskModalVisible(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        if (task.due_date) {
            setSelectedDate(new Date(task.due_date));
        } else {
            setSelectedDate(null);
        }
        setValueAssignee(task.band_member_id?.toString());
        setTaskModalVisible(true);
    };

    const TodoCard = ({ task }: { task: Task }) => {
        const isCreator = task.assigned_by === myBandMemberId || task.band_member_id === myBandMemberId;
        const hasDetails = task.description || task.due_date || activeTab === "Band Todos";

        return (
            <View className={`bg-boxBackground-light dark:bg-boxBackground-dark border border-accent-light dark:border-accent-dark rounded-2xl p-4 w-full mb-3 ${task.status === 'completed' ? 'opacity-70' : ''}`}>
                <View className={`flex-row justify-between ${hasDetails ? 'items-start' : 'items-center'}`}>
                    <Pressable onPress={() => toggleTaskStatus(task)} className={`mr-3 ${hasDetails ? 'mt-1' : ''}`}>
                        {task.status === "completed" ? (
                            <CheckSquare color={colorScheme === "dark" ? "#2B7FFF" : "#2B7FFF"} size={Math.min(fontSize["3xl"], 28)} />
                        ) : (
                            <Square color="#A1A1A1" size={Math.min(fontSize["3xl"], 28)} />
                        )}
                    </Pressable>
                    <View className="flex-1 flex-col">
                        <Text className={`font-bold text-black dark:text-white ${task.status === 'completed' ? 'line-through' : ''}`} style={{ fontSize: fontSize.xl }}>
                            {task.title}
                        </Text>

                        {task.description && (
                            <Text className={`text-silverText mt-1 ${task.status === 'completed' ? 'line-through' : ''}`} style={{ fontSize: fontSize.base }}>
                                {task.description}
                            </Text>
                        )}

                        {(task.due_date || activeTab === "Band Todos") && (
                            <View className="flex-row items-center mt-3 gap-3 flex-wrap">
                                {task.due_date && (
                                    <View className="flex-row items-center gap-1">
                                        <Calendar color="#A1A1A1" size={Math.min(fontSize.lg, 16)} />
                                        <Text className="text-silverText" style={{ fontSize: fontSize.sm }}>
                                            {new Date(task.due_date).toLocaleDateString()}
                                        </Text>
                                    </View>
                                )}

                                {activeTab === "Band Todos" && (
                                    <View className="flex-row items-center gap-1">
                                        <User color="#A1A1A1" size={Math.min(fontSize.lg, 16)} />
                                        <Text className="text-silverText" style={{ fontSize: fontSize.sm }}>
                                            {task.assignee_username}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {isCreator && (
                        <View className="flex-row items-center gap-3">
                            <Pressable onPress={() => openEditModal(task)}>
                                <Edit2 color="#A1A1A1" size={Math.min(fontSize.xl, 20)} />
                            </Pressable>
                            <Pressable onPress={() => handleDelete(task.task_id)}>
                                <Trash2 color="#FF4b4b" size={Math.min(fontSize.xl, 20)} />
                            </Pressable>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <PageContainer noBandState={!bandsLoading && bands.length === 0}>
            <View className="w-full h-full flex-col max-w-[800px] self-center">
                <PageHeader title="Todos" subtitle="Manage your band tasks" />

                <View className="flex-row justify-between items-start w-full border-b border-accent-light dark:border-accent-dark w-full px-4 pt-2">
                    <SwitchTabs
                        tabs={["My Todos", "Band Todos"]}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </View>

                <View className="flex-col justify-center items-center gap-3 w-full border-b border-accent-light dark:border-accent-dark w-full px-5 py-3 mb-4">
                    <View className="flex-row justify-between items-center w-full">
                        <Text className="text-silverText" style={{ fontSize: fontSize.base }}>
                            {activeTab === "My Todos" 
                                ? `${pendingTasks.length} pending todo${pendingTasks.length !== 1 ? 's' : ''}` 
                                : `${pendingTasks.length} pending todo${pendingTasks.length !== 1 ? 's' : ''}`}
                        </Text>
                        <StyledButton title="+ Add Todo" onPress={openCreateModal} />
                    </View>
                </View>

                {loadingTasks ? (
                    <ActivityIndicator size="large" color="#2B7FFF" className="mt-10" />
                ) : tasksLoadError ? (
                    <View className="flex-1 justify-center items-center mt-10">
                        <Text className="text-silverText text-center mb-4" style={{ fontSize: fontSize.base }}>
                            Failed to load todos. Please try again.
                        </Text>
                        <StyledButton title="Retry" onPress={fetchTasks} />
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} className="px-4">
                        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                            <Text className="text-silverText text-center mt-10" style={{ fontSize: fontSize.lg }}>
                                No todos found.
                            </Text>
                        ) : (
                            <View className="pb-20">
                                {pendingTasks.length > 0 && (
                                    <>
                                        <Text className="font-bold text-black dark:text-white mb-2 ml-1" style={{ fontSize: fontSize.lg }}>Pending</Text>
                                        {pendingTasks.map((t) => <TodoCard key={t.task_id} task={t} />)}
                                    </>
                                )}

                                {completedTasks.length > 0 && (
                                    <>
                                        <Text className="font-bold text-black dark:text-white mb-2 ml-1 mt-6" style={{ fontSize: fontSize.lg }}>Completed</Text>
                                        {completedTasks.map((t) => <TodoCard key={t.task_id} task={t} />)}
                                    </>
                                )}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            <StyledModal
                visible={taskModalVisible}
                onClose={() => setTaskModalVisible(false)}
                canClose={true}
                title={editingTask ? 'Edit Todo' : 'New Todo'}
            >
                <Formik
                    initialValues={{
                        title: editingTask?.title || "",
                        description: editingTask?.description || "",
                    }}
                    validationSchema={taskSchema}
                    enableReinitialize
                    onSubmit={async (values, { setSubmitting }) => {
                        try {
                            if (!myBandMemberId) {
                                Alert.alert("Error", "You are not an active member of this band");
                                return;
                            }

                            const payload = {
                                title: values.title,
                                description: values.description,
                                due_date: selectedDate ? selectedDate.toISOString() : null,
                                band_member_id: isLeader ? (valueAssignee ? parseInt(valueAssignee, 10) : myBandMemberId) : myBandMemberId,
                                assigned_by: editingTask ? editingTask.assigned_by : myBandMemberId,
                                status: editingTask ? editingTask.status : 'pending' // Just to make sure we don't accidentally wipe status if we did
                            };

                            const url = editingTask
                                ? `${apiUrl}/api/tasks/${editingTask.task_id}`
                                : `${apiUrl}/api/tasks`;
                            const method = editingTask ? "PUT" : "POST";

                            const response = await fetch(url, {
                                method,
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload),
                            });

                            if (!response.ok) {
                                throw new Error("Failed to save task");
                            }

                            setTaskModalVisible(false);
                            fetchTasks();
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to save task");
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <View className="w-full my-3 flex-col gap-4">
                            <StyledTextInput
                                placeholder="Task Title"
                                value={values.title}
                                onChangeText={handleChange("title")}
                                onBlur={handleBlur("title")}
                            />
                            {touched.title && errors.title && <ErrorText>{errors.title}</ErrorText>}

                            <StyledTextInput
                                placeholder="Description (optional)"
                                value={values.description}
                                onChangeText={handleChange("description")}
                                onBlur={handleBlur("description")}
                                multiline
                            />

                            {/* Assignee Dropdown */}
                            {isLeader && (
                                <View className="z-50">
                                    <Text className="text-silverText mb-2" style={{ fontSize: fontSize.sm }}>Assign to:</Text>
                                    <StyledDropdown
                                        open={openAssignee}
                                        value={valueAssignee}
                                        items={itemsAssignee}
                                        setOpen={setOpenAssignee}
                                        setValue={setValueAssignee}
                                        setItems={setItemsAssignee}
                                        placeholder="Select assigneee"
                                        zIndex={3000}
                                        zIndexInverse={1000}
                                    />
                                </View>
                            )}

                            {/* Date Picker */}
                            <View className="z-10 mt-2">
                                <Text className="text-silverText mb-2" style={{ fontSize: fontSize.sm }}>Due Date (optional):</Text>
                                <Pressable
                                    onPress={() => setShowDatePicker(true)}
                                    className="bg-white dark:bg-darkGray border border-accent-light dark:border-accent-dark rounded-2xl p-3"
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Calendar color={colorScheme === "dark" ? "#fff" : "#000"} size={20} />
                                        <Text className="text-black dark:text-white" style={{ fontSize: fontSize.sm }}>
                                            {selectedDate ? selectedDate.toLocaleDateString() : "Select a date"}
                                        </Text>
                                    </View>
                                </Pressable>
                                {selectedDate && (
                                    <Pressable className="mt-2 ml-1" onPress={() => setSelectedDate(null)}>
                                        <Text className="text-silverText underline" style={{ fontSize: fontSize.sm }}>Clear date</Text>
                                    </Pressable>
                                )}
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={selectedDate || new Date()}
                                        mode="date"
                                        display={Platform.OS === "ios" ? "inline" : "default"}
                                        onChange={(event, date) => {
                                            setShowDatePicker(Platform.OS === "ios");
                                            if (date) setSelectedDate(date);
                                        }}
                                    />
                                )}
                            </View>

                            <StyledButton title="Save Task" onPress={() => handleSubmit()} />
                        </View>
                    )}
                </Formik>
            </StyledModal>
        </PageContainer>
    );
};

export default todos;
