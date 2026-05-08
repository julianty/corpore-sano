import { useState, useContext } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  StyleSheet,
} from "react-native";
import { UserProfileContext } from "../../app/_layout";
import { useAppSelector } from "@shared/hooks";
import { FirestoreActions } from "@shared/helperFunctions/FirestoreActions";
import { MuscleTagStep } from "./MuscleTagStep";
import { useExerciseSearch } from "../../hooks/useExerciseSearch";

interface ExercisePickerModalProps {
  visible: boolean;
  onSelect: (name: string, variant: string, customExerciseId?: string) => void;
  onClose: () => void;
}

export function ExercisePickerModal({ visible, onSelect, onClose }: ExercisePickerModalProps) {
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"search" | "tagMuscle">("search");
  const [pendingName, setPendingName] = useState("");

  const ctx = useContext(UserProfileContext);
  const userId = useAppSelector((state) => state.auth.userId);
  const customExercises = ctx?.userProfile.customExercises ?? {};

  const { filtered, trimmed, showAddCustom } = useExerciseSearch(search, customExercises);

  function handleSelect(name: string, variant: string) {
    reset();
    onSelect(name, variant);
  }

  function handleAddCustom() {
    setPendingName(trimmed);
    setStep("tagMuscle");
  }

  function handleTagAndSelect(muscleGroup: string | null) {
    const name = pendingName;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const updated = { ...customExercises, [id]: { name, muscleGroup } };
    ctx?.setUserProfile((prev) => ({ ...prev, customExercises: updated }));
    FirestoreActions.updateCustomExercises(userId, updated);
    reset();
    onSelect(name, name, id);
  }

  function reset() {
    setSearch("");
    setStep("search");
    setPendingName("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  if (step === "tagMuscle") {
    return (
      <MuscleTagStep
        visible={visible}
        exerciseName={pendingName}
        onSelect={handleTagAndSelect}
        onClose={handleClose}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Exercise</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        <SectionList
          sections={filtered}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderSectionHeader={({ section }) => (
            <Text
              style={[
                styles.sectionHeader,
                section.isCustom && styles.sectionHeaderCustom,
              ]}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item, section }) =>
            section.isCustom ? (
              <Pressable
                onPress={() => handleSelect(item, item)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <Text style={styles.itemText}>{item}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handleSelect(section.title, item)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <Text style={styles.itemText}>{item}</Text>
              </Pressable>
            )
          }
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled
          ListFooterComponent={
            showAddCustom ? (
              <Pressable
                onPress={handleAddCustom}
                style={({ pressed }) => [styles.item, styles.addCustomItem, pressed && styles.itemPressed]}
              >
                <Text style={styles.addCustomText}>
                  Add "{trimmed}" as custom exercise
                </Text>
              </Pressable>
            ) : null
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "700" },
  closeButton: { padding: 8 },
  closeText: { fontSize: 16, color: "#007AFF" },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#555",
    backgroundColor: "#f0f0f0",
  },
  sectionHeaderCustom: {
    color: "#007AFF",
    backgroundColor: "#eef4ff",
  },
  item: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  itemPressed: { backgroundColor: "#e8f0fe" },
  itemText: { fontSize: 16, color: "#222" },
  addCustomItem: {
    marginTop: 8,
    borderBottomWidth: 0,
  },
  addCustomText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
