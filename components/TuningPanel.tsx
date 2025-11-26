import React from 'react';
import { TuningState } from '../types';

interface TuningPanelProps {
  tuning: TuningState;
  onUpdate: (newTuning: TuningState) => void;
}

const TuningPanel: React.FC<TuningPanelProps> = ({ tuning, onUpdate }) => {
  const handleChange = (key: keyof TuningState, value: number) => {
    onUpdate({ ...tuning, [key]: value });
  };

  // Helper to calculate approx HP for display (simplified conversion)
  // HP = Torque (Nm) * RPM / 7120. Using a representative RPM for peak power.
  const approxHP = Math.round((tuning.maxTorque * 6500) / 7120);

  const Slider = ({ 
    label, 
    prop, 
    min, 
    max, 
    step, 
    suffix = '', 
    displayValue 
  }: { 
    label: string, 
    prop: keyof TuningState, 
    min: number, 
    max: number, 
    step: number, 
    suffix?: string, 
    displayValue?: string | number 
  }) => (
    <div className="mb-3 group">
      <div className="flex justify-between text-xs text-gray-400 mb-1 group-hover:text-gray-300 transition-colors">
        <span>{label}</span>
        <span className="font-mono text-indigo-300">{displayValue ?? tuning[prop]}{suffix}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={tuning[prop]}
        onChange={(e) => handleChange(prop, parseFloat(e.target.value))}
        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-colors"
      />
    </div>
  );

  return (
    <div className="absolute top-4 right-4 w-72 bg-neutral-900/95 border border-neutral-700 text-white p-5 rounded-xl shadow-2xl backdrop-blur-md max-h-[90vh] overflow-y-auto scrollbar-hide">
      <div className="flex items-center justify-between mb-5 border-b border-gray-700 pb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Mechanic Shop
        </h2>
        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">LIVE</span>
      </div>

      <div className="space-y-6">
        {/* ENGINE */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Engine
          </h3>
          <Slider 
            label="Engine Power" 
            prop="maxTorque" 
            min={100} 
            max={1200} 
            step={10} 
            suffix=" HP" 
            displayValue={approxHP}
          />
          <Slider label="Rev Limit" prop="redlineRPM" min={4000} max={11000} step={100} suffix=" RPM" />
          <Slider label="Engine Inertia (Rev Speed)" prop="flywheelMass" min={0.1} max={1.5} step={0.05} />
        </div>

        {/* DRIVETRAIN */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Transmission
          </h3>
          <Slider 
            label="Final Drive Ratio" 
            prop="finalDriveRatio" 
            min={2.0} 
            max={5.0} 
            step={0.05} 
          />
          <p className="text-[10px] text-gray-500 -mt-1 mb-2 italic">
            {tuning.finalDriveRatio > 3.8 ? "Max Acceleration" : tuning.finalDriveRatio < 2.8 ? "Max Top Speed" : "Balanced"}
          </p>
        </div>

        {/* HANDLING */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div> Handling
          </h3>
           <Slider label="Tire Grip" prop="tireGrip" min={0.8} max={3.0} step={0.1} />
           <Slider label="Vehicle Weight" prop="mass" min={800} max={2500} step={50} suffix=" kg" />
           <Slider label="Braking Power" prop="brakingForce" min={4000} max={20000} step={500} suffix=" N" />
           <Slider label="Steering Response" prop="steerSpeed" min={1.0} max={5.0} step={0.1} />
           <Slider label="Aerodynamics (Drag)" prop="dragCoefficient" min={0.2} max={0.6} step={0.01} />
        </div>

        {/* SUSPENSION */}
        <div>
           <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-pink-500 rounded-full"></div> Suspension
          </h3>
          <Slider label="Spring Stiffness" prop="suspensionStiffness" min={20} max={150} step={5} />
          <Slider label="Shock Damping" prop="suspensionDamping" min={2} max={20} step={0.5} />
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-800 text-[10px] text-gray-600 text-center leading-relaxed">
        Modifications are applied instantly.<br/>
        Lower grip & higher power for drifting.
      </div>
    </div>
  );
};

export default TuningPanel;