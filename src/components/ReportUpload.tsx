import React, { useState, useEffect } from 'react';
import { supabase, Company } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, Loader } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

export default function ReportUpload() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    report_type: 'sustainability',
    report_year: new Date().getFullYear(),
    framework: 'GRI',
    source_url: '',
    report_text: '',
  });

  useEffect(() => {
    loadCompanies();
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    setExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    } finally {
      setExtracting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let text = '';

      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        const reader = new FileReader();
        text = await new Promise<string>((resolve, reject) => {
          reader.onload = (event) => {
            resolve(event.target?.result as string);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }

      setFormData({ ...formData, report_text: text });
    } catch (error: any) {
      alert('Error reading file: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.company_id) return;

    setLoading(true);
    setProcessing(true);

    try {
      const { data: reportData, error: reportError } = await supabase
        .from('esg_reports')
        .insert({
          company_id: formData.company_id,
          title: formData.title,
          report_type: formData.report_type,
          report_year: formData.report_year,
          source_type: 'upload',
          source_url: formData.source_url || null,
          raw_text: formData.report_text,
          framework: formData.framework,
          processing_status: 'processing',
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-esg-report`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: reportData.id,
          reportText: formData.report_text,
          companyId: formData.company_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze report');
      }

      const result = await response.json();

      setFormData({
        company_id: '',
        title: '',
        report_type: 'sustainability',
        report_year: new Date().getFullYear(),
        framework: 'GRI',
        source_url: '',
        report_text: '',
      });

      alert(`Report uploaded and analyzed successfully!\n\nExtracted Indicators: ${result.indicators}\nGreenwashing Flags: ${result.greenwashing_flags}\nESG Score: ${result.score?.overall_score || 'N/A'}`);
    } catch (error: any) {
      console.error('Error processing report:', error);
      alert('Error processing report: ' + error.message);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="glass-effect-light rounded-xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">Upload ESG Report</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Company *
              </label>
              <select
                required
                value={formData.company_id}
                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select a company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.sector})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Report Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., 2024 Sustainability Report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Report Type *
              </label>
              <select
                required
                value={formData.report_type}
                onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              >
                <option value="sustainability">Sustainability Report</option>
                <option value="esg">ESG Report</option>
                <option value="annual">Annual Report</option>
                <option value="csr">CSR Report</option>
                <option value="impact">Impact Report</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Report Year *
              </label>
              <input
                type="number"
                required
                value={formData.report_year}
                onChange={(e) => setFormData({ ...formData, report_year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                min="2000"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Framework *
              </label>
              <select
                required
                value={formData.framework}
                onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              >
                <option value="GRI">GRI Standards</option>
                <option value="SASB">SASB</option>
                <option value="EU_TAXONOMY">EU Taxonomy</option>
                <option value="TCFD">TCFD</option>
                <option value="HYBRID">Hybrid/Multiple</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Source URL
              </label>
              <input
                type="url"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                placeholder="https://example.com/report.pdf"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Upload Report File (PDF, Text, or CSV)
            </label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-lg hover:border-emerald-500 bg-slate-800/30 transition-all duration-200">
              <div className="space-y-1 text-center">
                {extracting ? (
                  <>
                    <Loader className="mx-auto h-12 w-12 text-emerald-400 animate-spin" />
                    <p className="text-sm text-emerald-400">Extracting text from PDF...</p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-slate-500" />
                    <div className="flex text-sm text-slate-400">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-emerald-400 hover:text-emerald-300">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.txt,.csv"
                          onChange={handleFileUpload}
                          disabled={extracting}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">PDF, TXT or CSV up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Or Paste Report Text *
            </label>
            <textarea
              required
              value={formData.report_text}
              onChange={(e) => setFormData({ ...formData, report_text: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm transition-all duration-200"
              placeholder="Paste the report text here..."
              disabled={extracting}
            />
            <p className="mt-1 text-sm text-slate-400">
              {formData.report_text.length} characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !formData.report_text}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 gradient-emerald text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Analyzing Report...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Analyze
                </>
              )}
            </button>
          </div>
        </form>

        {processing && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader className="w-5 h-5 text-emerald-400 animate-spin" />
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-300">AI Analysis in Progress</h3>
                <p className="text-sm text-emerald-200 mt-1">
                  Extracting ESG indicators, analyzing sentiment, and detecting potential greenwashing...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
