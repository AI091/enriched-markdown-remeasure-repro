import { memo, useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, View } from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';

const FINISHED_MESSAGES = 20;
const STREAM_CHUNKS = 60;
const STREAM_INTERVAL_MS = 100;
const CHUNK = 'More streamed text arrives and the reply grows. ';

const finishedMarkdown = (index: number) => `## Message ${index + 1}

Spaced repetition shows a card again **after a gap**.

- Recall first
- Then check

| Review | Gap |
|---|---|
| First | 1 day |
| Second | 3 days |`;

const finished = Array.from({ length: FINISHED_MESSAGES }, (_, index) => ({
  id: `finished-${index}`,
  markdown: finishedMarkdown(index),
}));

// Memoized so finished rows never re-render in React: any measurement of them comes from layout alone.
const Row = memo(function Row({ markdown }: { markdown: string }) {
  return (
    <View style={styles.row}>
      <EnrichedMarkdownText flavor="github" markdown={markdown} />
    </View>
  );
});

export default function App() {
  const [streamed, setStreamed] = useState('Streaming reply:');
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!streaming) return;
    let chunks = 0;
    const timer = setInterval(() => {
      chunks += 1;
      setStreamed((text) => text + ' ' + CHUNK);
      if (chunks === STREAM_CHUNKS) {
        clearInterval(timer);
        setStreaming(false);
      }
    }, STREAM_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [streaming]);

  const data = [...finished, { id: 'streaming', markdown: streamed }];

  return (
    <View style={styles.screen}>
      <Button
        title={streaming ? 'Streaming…' : 'Stream a reply'}
        disabled={streaming}
        onPress={() => {
          setStreamed('Streaming reply:');
          setStreaming(true);
        }}
      />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        initialNumToRender={FINISHED_MESSAGES + 1}
        renderItem={({ item }) => <Row markdown={item.markdown} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 48, backgroundColor: '#fff' },
  row: { paddingHorizontal: 16, paddingVertical: 8 },
});
