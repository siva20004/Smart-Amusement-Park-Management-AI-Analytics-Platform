import React, { useState, useEffect } from 'react';
import {
  Sparkles, Clock, Sun, CloudRain, Calendar, Users,
  CheckCircle2, AlertTriangle, Info, ArrowRight, RefreshCw
} from 'lucide-react';
import { Header } from '../components/Header';
import { predictionsApi, attractionsApi } from '../services/api';
import type { Attraction, WaitTimePrediction } from '../types';

export const WaitTimePredictor: React.FC = () => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttractionId, setSelectedAttractionId] = useState<number>(1);
  const [hourOfDay, setHourOfDay] = useState<number>(13);
  const [dayOfWeek, setDayOfWeek] = useState<number>(5);
  const [isWeekend, setIsWeekend] = useState<boolean>(true);
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [weather, setWeather] = useState<string>('Sunny');
  const [crowdFactor, setCrowdFactor] = useState<number>(1.2);

  const [prediction, setPrediction] = useState<WaitTimePrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const attrList = await attractionsApi.list();
        setAttractions(attrList);
        if (attrList.length > 0) {
          setSelectedAttractionId(attrList[0].id);
        }
        const m = await predictionsApi.getMetrics();
        setMetrics(m);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const handlePredict = async () => {
    try {
      setLoading(true);
      const res = await predictionsApi.predictWaitTime({
        attraction_id: selectedAttractionId,
        hour_of_day: hourOfDay,
        day_of_week: dayOfWeek,
        is_weekend: isWeekend,
        is_holiday: isHoliday,
        weather: weather,
        estimated_crowd_factor: crowdFactor,
      });
      setPrediction(res);
    } catch (err) {
      console.error(err);
      alert('Prediction inference failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAttractionId) {
      handlePredict();
    }
  }, [selectedAttractionId, hourOfDay, dayOfWeek, isWeekend, isHoliday, weather, crowdFactor]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="AI Queue Waiting Time Predictor"
        subtitle="RandomForest machine learning simulation of Fuji-Q ride queue dynamics"
        japaneseTitle="AI 待ち時間予測シミュレータ"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
                <Sparkles className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Operational Input Features
                </h3>
              </div>

              {/* Attraction Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Attraction (対象施設)</label>
                <select
                  value={selectedAttractionId}
                  onChange={(e) => setSelectedAttractionId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {attractions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.japanese_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time of Day Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Time of Day (時間帯)</span>
                  <span className="font-mono font-bold text-rose-400">{hourOfDay}:00 JST</span>
                </div>
                <input
                  type="range"
                  min="9"
                  max="20"
                  value={hourOfDay}
                  onChange={(e) => setHourOfDay(parseInt(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>09:00 Park Open</span>
                  <span>13:00 Peak</span>
                  <span>20:00 Close</span>
                </div>
              </div>

              {/* Day of Week */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Day of Week (曜日)</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setDayOfWeek(val);
                      setIsWeekend(val >= 5);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {days.map((d, idx) => (
                      <option key={idx} value={idx}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Weather Forecast (天候)</label>
                  <select
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Sunny">☀️ Sunny / Clear</option>
                    <option value="Cloudy">⛅ Overcast / Cloudy</option>
                    <option value="Rainy">🌧️ Precipitation / Rain</option>
                  </select>
                </div>
              </div>

              {/* Flags: Weekend & Holiday */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWeekend}
                    onChange={(e) => setIsWeekend(e.target.checked)}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <span className="text-slate-300 font-semibold">Weekend Surge</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHoliday}
                    onChange={(e) => setIsHoliday(e.target.checked)}
                    className="accent-rose-500 w-4 h-4"
                  />
                  <span className="text-slate-300 font-semibold">National Holiday</span>
                </label>
              </div>

              {/* Crowd Multiplier Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Park Crowd Density Index</span>
                  <span className="font-mono font-bold text-indigo-400">{crowdFactor.toFixed(1)}x Normal</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={crowdFactor}
                  onChange={(e) => setCrowdFactor(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <button
                onClick={handlePredict}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-evaluate Queue Model</span>
              </button>
            </div>

            {/* Model Architecture Info Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-slate-300 font-bold">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>Model Verification & Provenance</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Trained on 10,000 historical queue records utilizing a Scikit-learn{' '}
                <span className="text-white font-mono font-semibold">RandomForestRegressor</span> with 100 decision trees.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-1.5 rounded bg-slate-800 text-center">
                  <div className="text-[10px] text-slate-500">R² Score</div>
                  <div className="text-emerald-400 font-bold">{metrics?.wait_time_model?.r2_score || 0.970}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-800 text-center">
                  <div className="text-[10px] text-slate-500">MAE</div>
                  <div className="text-white font-bold">{metrics?.wait_time_model?.mae_minutes || 5.9}m</div>
                </div>
                <div className="p-1.5 rounded bg-slate-800 text-center">
                  <div className="text-[10px] text-slate-500">Samples</div>
                  <div className="text-indigo-400 font-bold">10,000</div>
                </div>
              </div>
            </div>
          </div>

          {/* Output Display Column (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {prediction && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      AI Queue Inference Output
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                        prediction.congestion_level === 'Low'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : prediction.congestion_level === 'Moderate'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {prediction.congestion_level} Congestion
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
                    {prediction.attraction_name}
                  </h2>
                  <p className="text-xs text-slate-400">{prediction.japanese_name}</p>
                </div>

                {/* Big Metric Display */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">Estimated Wait Time</span>
                    <div className="text-5xl font-black font-mono text-white mt-1 flex items-baseline gap-2">
                      <span className="text-rose-400">{prediction.predicted_wait_time_minutes}</span>
                      <span className="text-lg font-medium text-slate-400">minutes</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-mono">
                      Confidence Interval (95%): {prediction.confidence_interval[0]}m – {prediction.confidence_interval[1]}m
                    </p>
                  </div>

                  <div className="w-24 h-24 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center text-rose-400">
                    <Clock className="w-8 h-8" />
                    <span className="text-[11px] font-mono font-bold mt-1">Queue Model</span>
                  </div>
                </div>

                {/* Dispatch Window Recommendation */}
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1.5">
                  <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Operational Recommendation for Guests & Gate Crew</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {prediction.recommended_visiting_window}
                  </p>
                </div>

                {/* Feature Attribution Grid */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Inference Parameter Breakdown
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Hourly Cap</div>
                      <div className="font-mono font-bold text-white mt-0.5">{prediction.factors.capacity}/hr</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Time Slot</div>
                      <div className="font-mono font-bold text-white mt-0.5">{prediction.factors.hour}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Weather Mode</div>
                      <div className="font-mono font-bold text-white mt-0.5">{prediction.factors.weather}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Crowd Factor</div>
                      <div className="font-mono font-bold text-white mt-0.5">{prediction.factors.crowd_factor}x</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
