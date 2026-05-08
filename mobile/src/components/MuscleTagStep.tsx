import { Modal, View, Text, Pressable, StyleSheet } from "react-native";

const PARENT_GROUPS = ["Shoulders", "Back", "Chest", "Arms", "Core", "Legs"];

interface Props {
  visible: boolean;
  exerciseName: string;
  onSelect: (muscleGroup: string | null) => void;
  onClose: () => void;
}

export function MuscleTagStep({ visible, exerciseName, onSelect, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>"{exerciseName}"</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
        </View>
        <Text style={styles.tagPrompt}>
          Which muscle group does this target?
        </Text>
        {PARENT_GROUPS.map((group) => (
          <Pressable
            key={group}
            onPress={() => onSelect(group)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <Text style={styles.itemText}>{group}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => onSelect(null)}
          style={({ pressed }) => [styles.item, styles.skipItem, pressed && styles.itemPressed]}
        >
          <Text style={[styles.itemText, styles.skipText]}>Skip</Text>
        </Pressable>
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
  tagPrompt: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#555",
  },
  item: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  itemPressed: { backgroundColor: "#e8f0fe" },
  itemText: { fontSize: 16, color: "#222" },
  skipItem: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  skipText: { color: "#999" },
});
