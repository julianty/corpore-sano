import { useContext, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { UserProfileContext } from "../../app/_layout";
import { useAppSelector } from "@shared/hooks";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { normalizeExerciseKey } from "@shared/core/services/exerciseHistory";
import { useAppTheme, type AppColors } from "../../hooks/useAppTheme";

const PARENT_GROUPS = ["Shoulders", "Back", "Chest", "Arms", "Core", "Legs"];

export function CustomExercises() {
  const ctx = useContext(UserProfileContext);
  const userId = useAppSelector((state) => state.auth.userId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const colors = useAppTheme();
  const styles = makeStyles(colors);

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
    const oldName = customExercises[id].name;
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === oldName) {
      closeEdit();
      return;
    }
    const updated = {
      ...customExercises,
      [id]: { ...customExercises[id], name: trimmed },
    };
    setUserProfile((prev) => ({ ...prev, customExercises: updated }));
    FirestoreActions.updateCustomExercises(userId, updated);

    // History is keyed by the normalized exercise name, so a rename would fork
    // it: new sessions log under the new key while past lifts stay under the
    // old one. Carry the old key's history onto the new key. (No-op when both
    // names normalize to the same key, e.g. "curl a" -> "Curl A".)
    const oldKey = normalizeExerciseKey(oldName);
    const newKey = normalizeExerciseKey(trimmed);
    if (oldKey && newKey && oldKey !== newKey) {
      FirestoreActions.migrateExerciseHistory(userId, oldKey, newKey, trimmed);
    }
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
                    placeholderTextColor={colors.textMuted}
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

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { padding: 16, gap: 8 },
    label: { fontSize: 14, fontWeight: "600", marginBottom: 4, color: c.textPrimary },
    empty: { fontSize: 14, color: c.textMuted, fontStyle: "italic" },
    item: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      overflow: "hidden",
    },
    itemHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      backgroundColor: c.surface,
    },
    itemHeaderLeft: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: "500", color: c.textPrimary },
    itemGroup: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    chevron: { fontSize: 12, color: c.textMuted },
    editBody: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      gap: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 6,
      padding: 10,
      fontSize: 15,
      color: c.textPrimary,
    },
    renameButton: {
      backgroundColor: c.accent,
      borderRadius: 6,
      paddingVertical: 8,
      alignItems: "center",
    },
    renameButtonText: { color: c.textInverse, fontWeight: "600", fontSize: 14 },
    groupLabel: { fontSize: 12, fontWeight: "600", color: c.textSecondary },
    groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    groupChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.borderInput,
      backgroundColor: c.surface,
    },
    groupChipActive: { backgroundColor: c.accent, borderColor: c.accent },
    groupChipText: { fontSize: 13, color: c.textPrimary },
    groupChipTextActive: { color: c.textInverse },
    deleteButton: {
      paddingVertical: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 6,
    },
    deleteButtonText: { color: c.danger, fontWeight: "500", fontSize: 14 },
  });
}
