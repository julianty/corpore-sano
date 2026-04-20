import { useContext, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { UserProfileContext } from "../../app/_layout";
import { useAppSelector } from "@shared/hooks";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";

const PARENT_GROUPS = ["Shoulders", "Back", "Chest", "Arms", "Core", "Legs"];

export function CustomExercises() {
  const ctx = useContext(UserProfileContext);
  const userId = useAppSelector((state) => state.auth.userId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  if (!ctx) return null;
  const { userProfile, setUserProfile } = ctx;
  const customExercises = userProfile.customExercises ?? {};
  const entries = Object.entries(customExercises);

  function openEdit(id: string) {
    setEditingId(id);
    setDraftName(customExercises[id].name);
  }

  function closeEdit() {
    setEditingId(null);
    setDraftName("");
  }

  function saveRename(id: string) {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === customExercises[id].name) {
      closeEdit();
      return;
    }
    const updated = {
      ...customExercises,
      [id]: { ...customExercises[id], name: trimmed },
    };
    setUserProfile((prev) => ({ ...prev, customExercises: updated }));
    FirestoreActions.updateCustomExercises(userId, updated);
    closeEdit();
  }

  function saveMuscleGroup(id: string, muscleGroup: string | null) {
    const updated = {
      ...customExercises,
      [id]: { ...customExercises[id], muscleGroup },
    };
    setUserProfile((prev) => ({ ...prev, customExercises: updated }));
    FirestoreActions.updateCustomExercises(userId, updated);
  }

  function deleteExercise(id: string) {
    const updated = { ...customExercises };
    delete updated[id];
    setUserProfile((prev) => ({ ...prev, customExercises: updated }));
    FirestoreActions.updateCustomExercises(userId, updated);
    if (editingId === id) closeEdit();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>My Exercises</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>No custom exercises yet.</Text>
      ) : (
        entries.map(([id, entry]) => {
          const isEditing = editingId === id;
          return (
            <View key={id} style={styles.item}>
              <Pressable
                onPress={() => (isEditing ? closeEdit() : openEdit(id))}
                style={styles.itemHeader}
              >
                <View style={styles.itemHeaderLeft}>
                  <Text style={styles.itemName}>{entry.name}</Text>
                  <Text style={styles.itemGroup}>
                    {entry.muscleGroup ?? "Untagged"}
                  </Text>
                </View>
                <Text style={styles.chevron}>{isEditing ? "▲" : "▼"}</Text>
              </Pressable>

              {isEditing && (
                <View style={styles.editBody}>
                  <TextInput
                    style={styles.input}
                    value={draftName}
                    onChangeText={setDraftName}
                    onSubmitEditing={() => saveRename(id)}
                    returnKeyType="done"
                    selectTextOnFocus
                  />
                  <Pressable
                    onPress={() => saveRename(id)}
                    style={styles.renameButton}
                  >
                    <Text style={styles.renameButtonText}>Rename</Text>
                  </Pressable>

                  <Text style={styles.groupLabel}>Muscle group</Text>
                  <View style={styles.groupGrid}>
                    {PARENT_GROUPS.map((group) => (
                      <Pressable
                        key={group}
                        onPress={() => saveMuscleGroup(id, group)}
                        style={[
                          styles.groupChip,
                          entry.muscleGroup === group && styles.groupChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.groupChipText,
                            entry.muscleGroup === group &&
                              styles.groupChipTextActive,
                          ]}
                        >
                          {group}
                        </Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => saveMuscleGroup(id, null)}
                      style={[
                        styles.groupChip,
                        entry.muscleGroup === null && styles.groupChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.groupChipText,
                          entry.muscleGroup === null &&
                            styles.groupChipTextActive,
                        ]}
                      >
                        Untagged
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => deleteExercise(id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>Delete exercise</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  empty: { fontSize: 14, color: "#999", fontStyle: "italic" },
  item: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fafafa",
  },
  itemHeaderLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "500", color: "#111" },
  itemGroup: { fontSize: 12, color: "#888", marginTop: 2 },
  chevron: { fontSize: 12, color: "#aaa" },
  editBody: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
  },
  renameButton: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
  },
  renameButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  groupLabel: { fontSize: 12, fontWeight: "600", color: "#555" },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  groupChipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  groupChipText: { fontSize: 13, color: "#333" },
  groupChipTextActive: { color: "#fff" },
  deleteButton: {
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cc3300",
    borderRadius: 6,
  },
  deleteButtonText: { color: "#cc3300", fontWeight: "500", fontSize: 14 },
});
