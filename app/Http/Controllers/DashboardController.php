<?php

namespace App\Http\Controllers;

use App\Models\MasterKipas;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        $devices = MasterKipas::all();
        return view('dashboard', compact('devices'));
    }
}
