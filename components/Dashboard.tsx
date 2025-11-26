import React from 'react';
import { CarState, TuningState } from '../types';
import { TORQUE_CURVE } from '../constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DashboardProps {
  carState: CarState;
  tuning: TuningState;
}

const Dashboard: React.FC<DashboardProps> = ({ carState, tuning }) => {
  // Display Speed in Meters Per Second (M/S)
  // carState.speed is already in m/s (game units per second)
  const speedMs = Math.abs(carState.speed).toFixed(1);
  const rpm = Math.round(carState.rpm);
  
  // Gear display string
  let gearLabel = 'N';
  if (carState.gear === -1) gearLabel = 'R';
  else if (carState.gear > 0) gearLabel = carState.gear.toString();

  // Calculate RPM percentage for bar width
  const rpmPercent = Math.min((carState.rpm / tuning.redlineRPM) * 100, 100);
  
  // Color code RPM
  let rpmColor = 'bg-blue-500';
  if (rpmPercent > 70) rpmColor = 'bg-green-500';
  if (rpmPercent > 85) rpmColor = 'bg-yellow-500';
  if (rpmPercent > 95) rpmColor = 'bg-red-600';

  // Drift Indicator
  const isDrifting = carState.isDrifting;
  
  // Tire Grip Visualization
  const gripPercent = Math.min(carState.gripRatio * 100, 100);
  let gripColor = 'bg-green-500';
  if (gripPercent > 60) gripColor = 'bg-yellow-500';
  if (gripPercent > 90) gripColor = 'bg-red-500';
  if (isDrifting) gripColor = 'bg-purple-500';

  return (
    <div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none flex flex-col items-end justify-between gap-4 md:flex-row">
      
      {/* Left Cluster: Stats */}
      <div className="bg-black/80 text-white p-4 rounded-xl backdrop-blur-md border border-white/10 w-full md:w-96 shadow-xl relative overflow-hidden">
        {isDrifting && (
           <div className="absolute top-0 right-0 p-2 opacity-30 animate-pulse">
             <span className="text-4xl font-black italic text-purple-500">DRIFT</span>
           </div>
        )}

        <div className="flex justify-between items-center mb-2">
           <div className="text-5xl font-bold font-mono tracking-tighter text-white drop-shadow-lg">
            {speedMs} <span className="text-lg text-gray-400 font-normal">M/S</span>
          </div>
          <div className={`border-2 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner transition-colors duration-200 ${isDrifting ? 'border-purple-500 text-purple-500 bg-purple-900/20' : 'border-gray-600 text-white bg-gray-800'}`}>
            {gearLabel}
          </div>
        </div>

        {/* RPM Bar */}
        <div className="mb-1 flex justify-between text-xs text-gray-400 font-mono">
          <span>0</span>
          <span>RPM</span>
          <span>{tuning.redlineRPM}</span>
        </div>
        <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700 mb-4">
          <div 
            className={`h-full transition-all duration-75 ease-out ${rpmColor}`} 
            style={{ width: `${rpmPercent}%` }}
          />
        </div>

        {/* Tire Load Bar */}
        <div className="mb-1 flex justify-between text-xs text-gray-400 font-mono items-center">
            <span>GRIP LIMIT</span>
            {isDrifting && <span className="text-purple-400 font-bold">SLIDING</span>}
        </div>
        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
           <div 
             className={`h-full transition-all duration-75 ease-out ${gripColor}`} 
             style={{ width: `${gripPercent}%` }}
           />
        </div>

        <div className="mt-2 flex justify-between items-center">
            <div className="font-mono text-xs text-gray-500">
               SLIP ANGLE: {(carState.slipAngle * 57.29).toFixed(1)}°
            </div>
            <div className="font-mono text-sm text-gray-300">
              {rpm} RPM
            </div>
        </div>
      </div>

      {/* Middle: Controls Help (Hidden on small screens) */}
      <div className="hidden lg:block bg-black/50 text-white/60 p-4 rounded-xl text-sm font-mono backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          <span>W</span> <span>Gas</span>
          <span>A / D</span> <span>Steer</span>
          <span>S</span> <span>Brake</span>
          <span>SPACE</span> <span>E-Brake</span>
          <span>SHIFT</span> <span>Clutch</span>
          <span>↑ / ↓</span> <span>Gear Shift</span>
        </div>
      </div>

      {/* Right: Torque Curve */}
      <div className="bg-black/80 p-4 rounded-xl w-full md:w-64 h-48 border border-white/10 shadow-xl hidden sm:block">
        <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">Engine Map</h3>
        <div className="h-32 w-full">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TORQUE_CURVE}>
              <XAxis dataKey="rpm" hide domain={[0, 9000]} type="number" />
              <YAxis hide domain={[0, 1.2]} />
              <Line 
                type="monotone" 
                dataKey="factor" 
                stroke="#6366f1" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
              />
              <ReferenceLine x={carState.rpm} stroke="#ef4444" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;