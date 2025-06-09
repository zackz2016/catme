'use client';
import { useState } from 'react';
import Image from 'next/image';
import { catKinds } from '@/constants';
import { dataUrl } from '@/lib/utils';
import { PlaceholderValue } from '@/types';

interface CardProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const Card: React.FC<CardProps> = ({ label, selected, onClick }) => (
  <div
    className={`option-card ${selected ? 'option-card-selected' : 'option-card-default'}`}
    onClick={onClick}
  >
    {label}
  </div>
);

export default function Home() {
  const [step, setStep] = useState(1);
  const [selectedBreed, setSelectedBreed] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedPose, setSelectedPose] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelection = async (selection: string) => {
    if (step === 1) {
      setSelectedBreed(selection);
      setStep(2);
    } else if (step === 2) {
      setSelectedColor(selection);
      setStep(3);
    } else if (step === 3) {
      setSelectedPose(selection);
      await generateImage(selectedBreed, selectedColor, selection);
    }
  };

  const generateImage = async (breed: string, color: string, pose: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ breed, color, pose }),
      });
      
      const data = await response.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else if (data.error) {
        console.error('生成图片失败:', data.error);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentOptions = () => {
    if (step === 1) return catKinds.catBreeds
    if (step === 2) return catKinds.catColors;
    return catKinds.catPoses;
  };

  const getStepTitle = () => {
    if (step === 1) return '选择猫咪品种';
    if (step === 2) return '选择猫咪颜色';
    return '选择猫咪姿态';
  };

  const handleReset = () => {
    setStep(1);
    setSelectedBreed('');
    setSelectedColor('');
    setSelectedPose('');
    setGeneratedImage('');
  };

  return (
    <div className="main-container">
      {!isLoading && !generatedImage ? (
        <>
          <h1 className="page-title">{getStepTitle()}</h1>
          <div className="cards-grid">
            <div className="cards-grid-inner">
              {getCurrentOptions().map((option) => (
                <Card
                  key={option}
                  label={option}
                  selected={
                    (step === 1 && selectedBreed === option) ||
                    (step === 2 && selectedColor === option) ||
                    (step === 3 && selectedPose === option)
                  }
                  onClick={() => handleSelection(option)}
                />
              ))}
            </div>
          </div>
          {step > 1 && (
            <div className="button-container">
              <button onClick={() => setStep(step - 1)} className="back-button">
                返回上一步
              </button>
            </div>
          )}
        </>
      ) : isLoading ? (
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="section-title">正在生成图片...</h2>
          <div className="image-container loading-container">
            <div className="loading-text">请稍等片刻</div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="section-title">生成的猫咪图片</h2>
          <div className="image-container image-display">
            <Image
              src={generatedImage}
              alt="Generated cat"
              width={512}
              height={512}
              className="w-full h-full object-contain"
              placeholder={dataUrl as PlaceholderValue} 
            />
          </div>
          <button onClick={handleReset} className="reset-button">
            重新开始
          </button>
        </div>
      )}
    </div>
  );
}
