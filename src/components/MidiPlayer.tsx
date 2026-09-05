"use client";

import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MidiFile } from "@/types/database";
import { supabase } from "@/lib/supabase";

type MidiNote = { time: number; name: string; duration: number; velocity: number };
type PlaybackResources = { dispose: () => void };

export function MidiPlayer({ midi }: { midi: MidiFile }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bpm, setBpm] = useState<number | null>(null);
  const [volume, setVolume] = useState(80);
  const toneRef = useRef<typeof import("tone") | null>(null);
  const playbackRef = useRef<PlaybackResources | null>(null);
  const durationRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playCountedRef = useRef(false);

  useEffect(() => {
    playCountedRef.current = false;
    stop();
    return () => stop();
  }, [midi.id]);

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function updateProgress() {
    const tone = toneRef.current;
    if (!tone || durationRef.current <= 0) return;
    setProgress(Math.min(100, Math.round((tone.Transport.seconds / durationRef.current) * 100)));
  }

  function startProgressTimer() {
    clearTimer();
    timerRef.current = setInterval(updateProgress, 250);
  }

  async function start() {
    const [{ Midi }, Tone] = await Promise.all([import("@tonejs/midi"), import("tone")]);
    await Tone.start();
    toneRef.current = Tone;
    Tone.Destination.volume.value = volumeToDecibels(volume);

    if (!playCountedRef.current) {
      playCountedRef.current = true;
      void supabase.rpc("increment_midi_plays", { midi_id: midi.id });
    }

    if (playbackRef.current) {
      Tone.Transport.start();
      setPlaying(true);
      startProgressTimer();
      return;
    }

    const { data } = supabase.storage.from("midi-files").getPublicUrl(midi.storage_path);
    const response = await fetch(data.publicUrl);
    const parsed = new Midi(await response.arrayBuffer());
    const tempo = parsed.header.tempos[0]?.bpm || null;
    setBpm(tempo);
    durationRef.current = parsed.duration;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.seconds = 0;
    if (tempo) Tone.Transport.bpm.value = tempo;

    const resources = parsed.tracks.map((track) => {
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      const notes: MidiNote[] = track.notes.map((note) => ({ time: note.time, name: note.name, duration: note.duration, velocity: note.velocity }));
      const part = new Tone.Part<MidiNote>((time, note) => {
        synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
      }, notes).start(0);
      return { synth, part };
    });

    playbackRef.current = {
      dispose: () => resources.forEach(({ part, synth }) => { part.dispose(); synth.dispose(); }),
    };
    Tone.Transport.start();
    setProgress(0);
    setPlaying(true);
    startProgressTimer();
  }

  function pause() {
    toneRef.current?.Transport.pause();
    setPlaying(false);
    clearTimer();
  }

  function stop() {
    const tone = toneRef.current;
    tone?.Transport.stop();
    tone?.Transport.cancel();
    playbackRef.current?.dispose();
    playbackRef.current = null;
    playCountedRef.current = false;
    setPlaying(false);
    setProgress(0);
    clearTimer();
  }

  function changeVolume(value: number) {
    setVolume(value);
    if (toneRef.current) toneRef.current.Destination.volume.value = volumeToDecibels(value);
  }

  return <div className="player">
    <div className="player-top">
      <div className="player-icon">♪</div>
      <div><strong>{midi.title}</strong><span>{bpm ? `${Math.round(bpm)} BPM` : "MIDI file"} · {midi.filename}</span></div>
      <div className="player-actions"><button className="circle-button" title={playing ? "Pause" : "Play"} onClick={() => playing ? pause() : void start()}>{playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}</button><button className="circle-button muted" title="Stop" onClick={stop}><Square size={14} fill="currentColor" /></button></div>
    </div>
    <div className="progress-wrap"><input type="range" min="0" max="100" value={progress} onChange={(event) => setProgress(Number(event.target.value))} aria-label="Playback progress" /><span>{progress}%</span></div>
    <div className="volume"><Volume2 size={15} /><input type="range" min="0" max="100" value={volume} onChange={(event) => changeVolume(Number(event.target.value))} aria-label="Volume" /></div>
  </div>;
}

function volumeToDecibels(value: number) {
  if (value <= 0) return -60;
  return -60 + (value / 100) * 60;
}
