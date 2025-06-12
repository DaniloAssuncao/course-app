import Mux from '@mux/mux-node';
import MuxPlayer from '@mux/mux-player-react';

const mux = new Mux();

export default async function Page({ params }: { params: { id: string } }) {
  /* Get the asset metadata from your database here or directly from Mux like below. */
  const asset = await mux.video.assets.retrieve(params.id);
  return <MuxPlayer playbackId={asset.playback_ids?.[0].id!} accentColor="#ac39f2" />;
}