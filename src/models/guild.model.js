import mongoose from 'mongoose';

const schema = mongoose.Schema(
  {
    guild_id: {
      type: String,
      required: true,
    },
    guild_owner_id: {
      type: String,
      required: true,
    },
    guild_name: {
      type: String,
      required: true,
    },
    logging_channels: {
      type: Object,
    },
    track_channels: [String],
  },
  {
    timestamps: true,
  }
);

schema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Guild = mongoose.models.Guild || mongoose.model('Guild', schema);

export default Guild;
