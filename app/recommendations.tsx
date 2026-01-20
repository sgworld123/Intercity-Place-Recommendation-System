import { View, Text, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native";

export default function recommendations() {
  const [places, setPlaces] = useState<any[]>([]);
  const[loading,setLoading]=useState(false);

  useEffect(() => {
    const prepareAndSendPayload = async () => {
      try {
        // 1️⃣ Read from AsyncStorage
        setLoading(true);
        const [
          storedPrevCity,
          storedCurrCity,
          storedPlaces,
        ] = await Promise.all([
          AsyncStorage.getItem("previous_city"),
          AsyncStorage.getItem("current_city"),
          AsyncStorage.getItem("frequent-places"),
        ]);

        const prevCity = storedPrevCity ? JSON.parse(storedPrevCity) : null;
        const currCity = storedCurrCity ? JSON.parse(storedCurrCity) : null;
        const preferencePlaces = storedPlaces ? JSON.parse(storedPlaces) : [];

        // 2️⃣ Build payload (EXACT backend format)
        const payload = {
          previous_city: {
            name: prevCity?.name ?? "unknown",
            coordinates: {
              lat: prevCity?.coordinates?.lat ?? 0,
              lng: prevCity?.coordinates?.lng ?? 0,
            },
          },

          current_city: {
            name: currCity?.name ?? "unknown",
            coordinates: {
              lat: currCity?.coordinates?.lat ?? 0,
              lng: currCity?.coordinates?.lng ?? 0,
            },
          },

          source_places: preferencePlaces.map((p: any) => ({
            type: p.category?.toLowerCase() || "restaurant",
            name: p.name || "unknown",
            coordinates: {
              lat: p.latitude,
              lng: p.longitude,
            },
          })),
        };

        console.log("Sending payload:", JSON.stringify(payload, null, 2));

        // 3️⃣ Send to backend
        const response = await fetch("http://nami-hdya.onrender.com/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });


        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log("📥 Raw response body:", text);
        const data = text ? JSON.parse(text) : null;
        // console.log("✅ Parsed JSON:", data);

        const extracted =
          data?.results?.flatMap((item: any) =>
            item.recommended_places_near_current_city.map((place: any) => ({
              name: place.name,
              rating: place.rating ?? 0,
              address: place.address ?? "",
              drivingDistanceKm: place.driving_distance_from_current_city_km ?? 0,
              geminiSimilarity: place.similarity?.gemini_similarity ?? 0,
              similarity_score: place.similarity?.similarity_score ?? 0,
              distance_score: place.similarity?.distance_score ?? 0,
              density_score: place.similarity?.density_score ?? 0,
              pros: place.similarity?.pros ?? [],
              cons: place.similarity?.cons ?? [],
            }))
          ) ?? [];

        setPlaces(extracted);
      } catch (error) {
        console.error("Error preparing payload:", error);
      }
      finally { 
        setLoading(false); 
      }
    };
    prepareAndSendPayload();
  }, []);


  if (loading) {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#4F46E5" />
      <Text style={styles.loadingText}>Finding best places for you…</Text>
    </View>
  );
}

  return (
  <FlatList
    data={places}
    keyExtractor={(_, index) => index.toString()}
    contentContainerStyle={{ padding: 12 }}
    renderItem={({ item }) => (
      <View style={styles.card}>
        <Text style={styles.title}>{item.name}</Text>

        <Text>⭐ {item.rating}</Text>
        <Text>🚗 {item.drivingDistanceKm} km away</Text>
        <Text>🤖 Similarity Score: {item.geminiSimilarity * 0.5 + item.similarity_score * 0.2 +
          item.distance_score * 0.2 + item.density_score * 0.1}%</Text>

        <Text style={styles.section}>Pros</Text>
        {item.pros.map((p: string, i: number) => (
          <Text key={`pro-${i}`}>• {p}</Text>
        ))}

        <Text style={styles.section}>Cons</Text>
        {item.cons.map((c: string, i: number) => (
          <Text key={`con-${i}`}>• {c}</Text>
        ))}
      </View>
    )}
  />
);

}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,

    // Android shadow
    elevation: 3,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  section: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  center: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#F9FAFB",
},

loadingText: {
  marginTop: 10,
  fontSize: 14,
  color: "#6B7280",
},

emptyText: {
  fontSize: 15,
  color: "#9CA3AF",
  textAlign: "center",
  paddingHorizontal: 20,
},

});
