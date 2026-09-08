import { StyleSheet, ScrollView, Image, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/api/client';
import { Search, MapPin, Star } from 'lucide-react-native';
import { Link } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useState } from 'react';

export default function CaterersScreen() {
  const colorScheme = useColorScheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data, isLoading } = useQuery({
    queryKey: ['caterers'],
    queryFn: async () => {
      const response = await api.get('/caterers');
      return response.data;
    },
  });

  const caterers = data?.data || [];

  const filteredCaterers = caterers.filter((c: any) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(query) ||
      (Array.isArray(c.cuisines) 
        ? c.cuisines.some((cs: string) => cs.toLowerCase().includes(query))
        : typeof c.cuisines === 'string' && c.cuisines.toLowerCase().includes(query)) ||
      c.location?.toLowerCase().includes(query)
    );
  });

  const renderCatererCard = ({ item }: { item: any }) => (
    <Link href={`/caterer/${item.id}`} asChild>
      <Pressable style={styles.catererCard}>
        <Image source={{ uri: item.cover_image }} style={styles.catererImage} />
        <View style={styles.catererInfo}>
          <View style={styles.catererHeader}>
            <Text style={styles.catererName}>{item.name}</Text>
            <View style={styles.ratingBadge}>
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Text style={styles.ratingText}>{item.rating || '5.0'}</Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={14} color="#666" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
          <Text style={styles.cuisineText}>{item.cuisines}</Text>
          <Text style={styles.priceRange}>{item.price_range} • Min {item.min_guests} guests</Text>
        </View>
      </Pressable>
    </Link>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>All Caterers</Text>
        <View style={styles.searchBar}>
          <Search size={20} color="#666" />
          <TextInput 
            placeholder="Search caterers..." 
            style={styles.searchInput}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.catererList}>
        {isLoading ? (
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        ) : filteredCaterers.length === 0 ? (
          <Text style={styles.emptyText}>No caterers found</Text>
        ) : (
          filteredCaterers.map((caterer: any) => (
            <View key={caterer.id} style={styles.cardWrapper}>
              {renderCatererCard({ item: caterer })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  catererList: {
    padding: 20,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  catererCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  catererImage: {
    width: '100%',
    height: 180,
  },
  catererInfo: {
    padding: 15,
  },
  catererHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  catererName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  cuisineText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 5,
  },
  priceRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});
