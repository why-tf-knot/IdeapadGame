import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ideasAPI } from '../services/api';

interface CreateIdeaScreenProps {
  navigation: any;
}

const CreateIdeaScreen: React.FC<CreateIdeaScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    oneLineSummary: '',
    category: 'App' as any,
    stage: 'Idea' as any,
    targetUser: '',
    problem: '',
    solution: '',
    differentiation: '',
    monetization: '',
    roadmap: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      'title',
      'oneLineSummary',
      'targetUser',
      'problem',
      'solution',
      'differentiation',
      'monetization',
      'roadmap',
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        Alert.alert('Error', `Please fill in ${field}`);
        return;
      }
    }

    if (formData.oneLineSummary.length > 140) {
      Alert.alert('Error', 'One-line summary must be 140 characters or less');
      return;
    }

    setLoading(true);
    try {
      await ideasAPI.create(formData);
      Alert.alert('Success', 'Idea created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create idea');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create New Idea</Text>

        <Text style={styles.label}>Title*</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
          placeholder="Enter idea title"
        />

        <Text style={styles.label}>One-Line Summary* (max 140 chars)</Text>
        <TextInput
          style={styles.input}
          value={formData.oneLineSummary}
          onChangeText={(text) => setFormData({ ...formData, oneLineSummary: text })}
          placeholder="Describe your idea in one line"
          maxLength={140}
        />
        <Text style={styles.charCount}>{formData.oneLineSummary.length}/140</Text>

        <Text style={styles.label}>Category*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <Picker.Item label="App" value="App" />
            <Picker.Item label="Website" value="Website" />
            <Picker.Item label="SaaS" value="SaaS" />
            <Picker.Item label="AI Tool" value="AI Tool" />
            <Picker.Item label="Content/Productized Service" value="Content/Productized Service" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        <Text style={styles.label}>Stage*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.stage}
            onValueChange={(value) => setFormData({ ...formData, stage: value })}>
            <Picker.Item label="Idea" value="Idea" />
            <Picker.Item label="Prototype" value="Prototype" />
            <Picker.Item label="MVP" value="MVP" />
            <Picker.Item label="Launched" value="Launched" />
          </Picker>
        </View>

        <Text style={styles.label}>Target User*</Text>
        <TextInput
          style={styles.input}
          value={formData.targetUser}
          onChangeText={(text) => setFormData({ ...formData, targetUser: text })}
          placeholder="e.g., developers, teachers, students"
        />

        <Text style={styles.label}>Problem*</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.problem}
          onChangeText={(text) => setFormData({ ...formData, problem: text })}
          placeholder="What problem does this solve?"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Solution*</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.solution}
          onChangeText={(text) => setFormData({ ...formData, solution: text })}
          placeholder="How does your idea solve the problem?"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Differentiation*</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.differentiation}
          onChangeText={(text) => setFormData({ ...formData, differentiation: text })}
          placeholder="What makes this different from existing solutions?"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Monetization*</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.monetization}
          onChangeText={(text) => setFormData({ ...formData, monetization: text })}
          placeholder="How will this make money?"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Roadmap*</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.roadmap}
          onChangeText={(text) => setFormData({ ...formData, roadmap: text })}
          placeholder="What are your next steps?"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Idea'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateIdeaScreen;
