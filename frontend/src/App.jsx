import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Scanner from './components/Scanner';
import BenchmarkTab from './components/BenchmarkTab';
import ThesisDocsTab from './components/ThesisDocsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');

  return (
    <div className="min-h-screen bg-[#0A0E17] text-gray-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scanner' && <Scanner />}
        {activeTab === 'benchmark' && <BenchmarkTab />}
        {activeTab === 'docs' && <ThesisDocsTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-[#070A10] py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-medium text-gray-400">
            KLCN04 — Khóa luận Cử nhân ngành An toàn Thông tin
          </p>
          <p>
            Phát Hiện Mã Độc Windows PE Dựa Trên Phân Tích Tĩnh & Học Máy • EMBER 2018 v2
          </p>
        </div>
      </footer>
    </div>
  );
}
