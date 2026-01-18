import { View, Text, TouchableOpacity } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

export default function SendPayload() {
  const params = useLocalSearchParams()

  const payload = {
    sourceLocation: {
      latitude: Number(params.sourceLat),
      longitude: Number(params.sourceLng)
    },
    preferencePlaces: JSON.parse(params.places as string),
    targetLocation: {
      latitude: 19.0760,
      longitude: 72.8777 // HARD CODE for prototype
    }
  }

  const sendToBackend = async () => {
    console.log('FINAL PAYLOAD 👉', payload)

    await fetch('http://YOUR_BACKEND_URL/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text>Payload ready. Check console.</Text>

      <TouchableOpacity
        style={{ marginTop: 20, backgroundColor: '#0a8f7a', padding: 15 }}
        onPress={sendToBackend}
      >
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          Send to backend
        </Text>
      </TouchableOpacity>
    </View>
  )
}
