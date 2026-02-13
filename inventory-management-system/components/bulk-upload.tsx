import { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, Image as ImageIcon, CheckCircle2, 
  XCircle, AlertCircle, Download, Loader2, ChevronRight, 
  Info, FileSpreadsheet, Package, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface BulkUploadJob {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  total_products: number;
  processed: number;
  successful: number;
  failed: number;
  errors?: Array<{ row: number; sku: string; message: string; }>;
  started_at: string;
  completed_at?: string;
}

interface BulkUploadProps {
  currentStore: any;
  apiBaseUrl: string;
  onSuccess?: () => void;
}

export default function BulkUpload({ currentStore, apiBaseUrl, onSuccess }: BulkUploadProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'instructions' | 'upload' | 'progress'>('instructions');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<BulkUploadJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setStep('instructions');
        setCsvFile(null);
        setZipFile(null);
        setJobId(null);
        setJobStatus(null);
        setError(null);
        setIsUploading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!jobId || step !== 'progress') return;
    let isMounted = true;
    const pollStatus = async () => {
      try {
        const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        const response = await fetch(`${apiBaseUrl}/products/bulk-upload/status?job_id=${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success && isMounted) {
          setJobStatus(data.data);
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            if (data.data.status === 'completed' && onSuccess) onSuccess();
            return;
          }
        }
      } catch (err) { console.error(err); }
    };
    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [jobId, step, apiBaseUrl, onSuccess]);

  const handleDownloadTemplate = () => {
    const csvContent = `sku,product_name,description,barcode,buying_price,selling_price,wholesale_price,minimum_selling_price,unit_of_measure,reorder_level,brand,color,size,is_featured,category_name,image_filename,initial_stock\nPROD-001,New Item,Desc,12345,10,20,18,15,PCS,5,Brand,Blue,L,false,General,img1.jpg,100`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!csvFile || !currentStore?.id) {
      setError('A CSV file is required.');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('products_csv', csvFile);
      if (zipFile) formData.append('images_zip', zipFile);
      formData.append('store_ids', JSON.stringify([currentStore.id]));
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      const response = await fetch(`${apiBaseUrl}/products/bulk-upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.success) { setJobId(data.data.job_id); setStep('progress'); } 
      else { setError(data.error || 'Upload failed.'); }
    } catch (err) { setError('Connection error.'); } 
    finally { setIsUploading(false); }
  };

  const resetUpload = () => {
    setStep('instructions');
    setCsvFile(null);
    setZipFile(null);
    setJobId(null);
    setJobStatus(null);
    setError(null);
  };

  if (!currentStore) return <Button variant="outline" disabled className="gap-2"><Upload className="h-4 w-4" /> Bulk Upload</Button>;

  const StepIndicator = ({ num, label, active, completed }: any) => (
    <div className={cn("flex items-center gap-1.5", active ? "text-blue-600 dark:text-blue-400" : completed ? "text-green-600 dark:text-green-500" : "text-slate-400 dark:text-slate-500")}>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
        active ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500" : 
        completed ? "border-green-600 bg-green-50 dark:bg-green-900/20 dark:border-green-500" : 
        "border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-700"
      )}>
        {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : num}
      </div>
      <span className="text-[10px] font-medium hidden sm:inline">{label}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Bulk Upload
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[567px] h-[454px] p-0 flex flex-col gap-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
        
        <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-4 py-2.5 flex-none">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between text-slate-900 dark:text-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm">Bulk Upload</span>
              </div>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border dark:border-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-600" />
                <span className="max-w-[100px] truncate">{currentStore.store_name}</span>
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center mt-3 mb-1">
            <StepIndicator num="1" label="Prepare" active={step === 'instructions'} completed={step !== 'instructions'} />
            <div className={cn("h-[2px] w-8 mx-1.5", step !== 'instructions' ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700")} />
            <StepIndicator num="2" label="Upload" active={step === 'upload'} completed={step === 'progress'} />
            <div className={cn("h-[2px] w-8 mx-1.5", step === 'progress' ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700")} />
            <StepIndicator num="3" label="Process" active={step === 'progress'} completed={false} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          
          {step === 'instructions' && (
            <div className="space-y-3">
              
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="text-blue-500 w-4 h-4" />
                  How to prepare
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <div className="flex-none w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">1</div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-200">Download Template</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-none w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">2</div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-200 mb-1">Fill Required Fields</p>
                      <div className="flex flex-wrap gap-1">
                        {['sku', 'product_name', 'buying_price', 'selling_price'].map(field => (
                          <span key={field} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono rounded">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-none w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">3</div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-200">Optional: Add Images ZIP</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3 rounded-lg text-center">
                <Download className="text-blue-600 dark:text-blue-400 w-5 h-5 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Get Template</p>
                <Button onClick={handleDownloadTemplate} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs">
                  Download CSV
                </Button>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-3">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-2 flex items-center gap-2 text-xs">
                  <XCircle className="text-red-600 dark:text-red-400 w-4 h-4 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => csvInputRef.current?.click()}
                  className={cn(
                    "group border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-32",
                    csvFile 
                      ? "border-green-500 bg-green-50/50 dark:bg-green-900/20" 
                      : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                  )}
                >
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={csvInputRef}
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  
                  {csvFile ? (
                    <>
                      <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400 mb-1" />
                      <p className="font-semibold text-green-900 dark:text-green-100 truncate w-full px-2 text-[10px]">{csvFile.name}</p>
                      <p className="text-[9px] text-green-700 dark:text-green-300 mt-0.5">{(csvFile.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 mb-1" />
                      <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">CSV File</p>
                      <div className="mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-[9px] font-bold text-blue-600 dark:text-blue-400">
                        REQUIRED
                      </div>
                    </>
                  )}
                </div>

                <div 
                  onClick={() => zipInputRef.current?.click()}
                  className={cn(
                    "group border-2 border-dashed rounded-lg p-3 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-32",
                    zipFile 
                      ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/20" 
                      : "border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
                  )}
                >
                  <input 
                    type="file" 
                    accept=".zip" 
                    className="hidden" 
                    ref={zipInputRef}
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  />

                  {zipFile ? (
                    <>
                      <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-1" />
                      <p className="font-semibold text-purple-900 dark:text-purple-100 truncate w-full px-2 text-[10px]">{zipFile.name}</p>
                      <p className="text-[9px] text-purple-700 dark:text-purple-300 mt-0.5">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-purple-500 mb-1" />
                      <p className="font-semibold text-slate-700 dark:text-slate-200 text-xs">Images ZIP</p>
                      <div className="mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-bold text-slate-500 dark:text-slate-400">
                        OPTIONAL
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'progress' && jobStatus && (
            <div className="space-y-3">
              
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800">
                <div className="flex-shrink-0">
                  {jobStatus.status === 'processing' && <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />}
                  {jobStatus.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />}
                  {jobStatus.status === 'failed' && <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {jobStatus.status === 'processing' ? 'Processing...' : 
                     jobStatus.status === 'completed' ? 'Completed' : 'Failed'}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {jobStatus.processed} of {jobStatus.total_products} processed
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-[10px] font-medium">
                  <span className="text-slate-700 dark:text-slate-300">Progress</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">{Math.round((jobStatus.processed / (jobStatus.total_products || 1)) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500 ease-out rounded-full",
                      jobStatus.status === 'failed' ? "bg-red-500" : 
                      jobStatus.status === 'completed' ? "bg-green-500" : "bg-blue-600"
                    )}
                    style={{ width: `${(jobStatus.processed / (jobStatus.total_products || 1)) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t dark:border-slate-800">
                  <div className="text-center">
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100">{jobStatus.total_products}</div>
                    <div className="text-[9px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Total</div>
                  </div>
                  <div className="text-center border-l dark:border-slate-800">
                    <div className="text-base font-bold text-green-600 dark:text-green-500">{jobStatus.successful}</div>
                    <div className="text-[9px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Success</div>
                  </div>
                  <div className="text-center border-l dark:border-slate-800">
                    <div className="text-base font-bold text-red-600 dark:text-red-500">{jobStatus.failed}</div>
                    <div className="text-[9px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Failed</div>
                  </div>
                </div>
              </div>

              {jobStatus.errors && jobStatus.errors.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden">
                  <div className="bg-red-50 dark:bg-red-900/20 px-3 py-1.5 border-b border-red-100 dark:border-red-900/30 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span className="text-red-900 dark:text-red-200 font-semibold text-[10px]">Issues ({jobStatus.errors.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-[10px]">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium">Row</th>
                          <th className="px-2 py-1 text-left font-medium">SKU</th>
                          <th className="px-2 py-1 text-left font-medium">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {jobStatus.errors.map((err, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-2 py-1 font-mono text-slate-500 dark:text-slate-400">{err.row}</td>
                            <td className="px-2 py-1 font-mono text-slate-900 dark:text-slate-100">{err.sku}</td>
                            <td className="px-2 py-1 text-red-600 dark:text-red-400">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'progress' && !jobStatus && (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">Initializing...</p>
            </div>
          )}
        </div>

        <div className="border-t dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 flex-none flex justify-between items-center">
          {step === 'instructions' && (
            <>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Step 1 of 3</span>
              <Button onClick={() => setStep('upload')} size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 h-7 text-xs px-3">
                Continue <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </>
          )}

          {step === 'upload' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setStep('instructions')} className="dark:text-slate-300 h-7 text-xs px-3">
                Back
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !csvFile}
                size="sm"
                className="min-w-[100px] bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 h-7 text-xs px-3"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                {isUploading ? 'Uploading...' : 'Start'}
              </Button>
            </>
          )}

          {step === 'progress' && (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') && (
            <>
              <Button variant="outline" size="sm" onClick={resetUpload} className="gap-1.5 dark:border-slate-700 h-7 text-xs px-3">
                <RefreshCw className="w-3 h-3" /> New Upload
              </Button>
              <Button onClick={() => setOpen(false)} size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 h-7 text-xs px-3">
                Done
              </Button>
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}