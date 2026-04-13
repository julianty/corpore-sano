import { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  SectionList,
  StyleSheet,
} from "react-native";
import exerciseCatalogUpdated from "@shared/data/exerciseCatalogUpdated";

interface ExercisePickerModalProps {
  visible: boolean;
  onSelect: (name: string, variant: string) => void;
  onClose: () => void;
}

interface Section {
  title: string;
  data: string[];
}

const ALL_SECTIONS: Section[] = exerciseCatalogUpdated.data.map((e) => ({
  title: e.name,
  data: e.variants ?? [],
}));

export function ExercisePickerModal({
  visible,
  onSelect,
  onClose,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return ALL_SECTIONS;
    const q = search.toLowerCase();
    return ALL_SECTIONS.map((section) => ({
      title: section.title,
      data: section.data.filter(
        (v) =>
          v.toLowerCase().includes(q) ||
          section.title.toLowerCase().includes(q),
      ),
    })).filter((s) => s.data.length > 0);
  }, [search]);

  function handleSelect(sectionTitle: string, variant: string) {
    setSearch("");
    onSelect(sectionTitle, variant);
  }

  function handleClose() {
    setSearch("");
    onClose();
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
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item, section }) => (
            <Pressable
              onPress={() => handleSelect(section.title, item)}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
            >
              <Text style={styles.itemText}>{item}</Text>
            </Pressable>
          )}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled
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
  item: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  itemPressed: { backgroundColor: "#e8f0fe" },
  itemText: { fontSize: 16, color: "#222" },
});
