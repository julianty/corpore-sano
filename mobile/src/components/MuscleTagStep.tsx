import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useAppTheme, type AppColors } from "../../hooks/useAppTheme";

const PARENT_GROUPS = ["Shoulders", "Back", "Chest", "Arms", "Core", "Legs"];

interface Props {
  visible: boolean;
  exerciseName: string;
  onSelect: (muscleGroup: string | null) => void;
  onClose: () => void;
}

export function MuscleTagStep({ visible, exerciseName, onSelect, onClose }: Props) {
  const colors = useAppTheme();
  const styles = makeStyles(colors);

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

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    title: { fontSize: 18, fontWeight: "700", color: c.textPrimary },
    closeButton: { padding: 8 },
    closeText: { fontSize: 16, color: c.accent },
    tagPrompt: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: c.textSecondary,
    },
    item: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    itemPressed: { backgroundColor: c.accentSubtle },
    itemText: { fontSize: 16, color: c.textPrimary },
    skipItem: {
      marginTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
    },
    skipText: { color: c.textMuted },
  });
}
