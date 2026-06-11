import Review from '../models/Review.js';
import Bike from '../models/Bike.js';

export async function refreshBikeRating(bikeId) {
  const agg = await Review.aggregate([
    { $match: { bike_id: bikeId } },
    { $group: { _id: '$bike_id', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0]?.avgRating ?? 4.5;
  await Bike.findByIdAndUpdate(bikeId, { rating: Math.round(avg * 10) / 10 });
  return { averageRating: avg, reviewCount: agg[0]?.count ?? 0 };
}
