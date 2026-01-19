// app/recommendations.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  SectionList,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");

interface Recommendation {
  name: string;
  distanceKm: number;
  userRating: number;
  score: number;
  pros: string[];
  cons: string[];
}

interface RecommendationsResponse {
  success: boolean;
  results: Recommendation[];
}

export default function RecommendationsScreen() {
  const params = useLocalSearchParams();
  const resultsString = params.results as string;

  let response: RecommendationsResponse;

  try {
    response = JSON.parse(resultsString);
  } catch (error) {
    Alert.alert(
      "Error",
      "Failed to load recommendations. Please try again.",
      [{ text: "OK", onPress: () => router.push('/frequent-places') }]
    );
    return null;
  }
  const results = response.results ?? [];

  const sections = results.length
  ? [
      {
        title: "Recommended Places",
        data: results,
      },
    ]
  : [];

  const renderRecommendation = ({ item }: { item: Recommendation }) => (
    <View style={styles.card}>
      {/* Name & Distance */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.distanceBadge}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.distanceText}>{item.distanceKm.toFixed(1)}km</Text>
        </View>
      </View>

      {/* Rating & Score */}
      <View style={styles.cardMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{item.userRating}</Text>
          <Text style={styles.metricLabel}>Rating</Text>
        </View>
        <View style={styles.metric}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{(item.score * 100).toFixed(0)}%</Text>
          </View>
          <Text style={styles.metricLabel}>Match</Text>
        </View>
      </View>

      {/* Pros */}
      <View style={styles.prosSection}>
        <Text style={styles.sectionTitle}>Pros</Text>
        {item.pros.map((pro, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{pro}</Text>
          </View>
        ))}
      </View>

      {/* Cons */}
      <View style={styles.consSection}>
        <Text style={styles.sectionTitle}>Cons</Text>
        {item.cons.map((con, index) => (
          <View key={index} style={[styles.tag, styles.consTag]}>
            <Text style={styles.tagText}>{con}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  if (!sections.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="search-circle-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No recommendations yet</Text>
          <Text style={styles.emptySubtitle}>
            Pick your destination to see similar places
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.name}
        renderItem={renderRecommendation}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
        SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 24,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 24,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
  },
  cardMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metric: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E293B",
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scoreText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  prosSection: {
    marginBottom: 16,
  },
  consSection: {},
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 10,
  },
  tag: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  consTag: {
    backgroundColor: "#FEF2F2",
  },
  tagText: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "500",
  },
  itemSeparator: {
    height: 0,
  },
  sectionSeparator: {
    height: 24,
  },
});
